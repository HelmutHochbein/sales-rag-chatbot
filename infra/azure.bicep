@maxLength(20)
@minLength(4)
@description('Used to generate names for all resources in this file')
param resourceBaseName string

@secure()
param anthropicKey string

param anthropicModel string = 'claude-haiku-4-5-20251001'

@secure()
param notionToken string = ''

param notionRootPageId string = ''

param webAppSKU string

@maxLength(42)
param botDisplayName string

param serverfarmsName string = resourceBaseName
param webAppName string = resourceBaseName
param identityName string = resourceBaseName
param location string = resourceGroup().location

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  location: location
  name: identityName
}

resource serverfarm 'Microsoft.Web/serverfarms@2021-02-01' = {
  kind: 'app'
  location: location
  name: serverfarmsName
  sku: {
    name: webAppSKU
  }
}

// === Conversation State (Azure Table Storage) ===
// Storage Account + Table für Multi-Turn-History pro Channel-User.
// Zugriff via Managed Identity (User Assigned, siehe `identity` oben).
resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${replace(toLower(resourceBaseName), '-', '')}st'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource tableSvc 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' = {
  parent: storage
  name: 'default'
}

resource convTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableSvc
  name: 'BotConversations'
}

// "Storage Table Data Contributor" Rolle für die User-Assigned Identity.
resource tableRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: guid(storage.id, identity.id, 'tabledata-contrib')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
    )
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  kind: 'app'
  location: location
  name: webAppName
  properties: {
    serverFarmId: serverfarm.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      appSettings: [
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'RUNNING_ON_AZURE', value: '1' }
        // Bot authentication (Managed Identity)
        { name: 'CLIENT_ID', value: identity.properties.clientId }
        { name: 'TENANT_ID', value: identity.properties.tenantId }
        { name: 'BOT_TYPE', value: 'UserAssignedMsi' }
        { name: 'MICROSOFT_APP_TYPE', value: 'UserAssignedMSI' }
        { name: 'MICROSOFT_APP_ID', value: identity.properties.clientId }
        { name: 'MICROSOFT_APP_TENANT_ID', value: identity.properties.tenantId }
        // Anthropic
        { name: 'ANTHROPIC_API_KEY', value: anthropicKey }
        { name: 'ANTHROPIC_MODEL', value: anthropicModel }
        // Conversation State (Azure Table Storage)
        { name: 'AZURE_TABLE_ENDPOINT', value: storage.properties.primaryEndpoints.table }
        { name: 'AZURE_TABLE_NAME', value: 'BotConversations' }
        { name: 'AZURE_USE_MANAGED_IDENTITY', value: '1' }
        // Notion (direkter API-Zugriff, exposed als Custom-Tools)
        { name: 'NOTION_TOKEN', value: notionToken }
        { name: 'NOTION_ROOT_PAGE_ID', value: notionRootPageId }
      ]
      ftpsState: 'FtpsOnly'
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
}

module azureBotRegistration './botRegistration/azurebot.bicep' = {
  name: 'Azure-Bot-registration'
  params: {
    resourceBaseName: resourceBaseName
    identityClientId: identity.properties.clientId
    identityResourceId: identity.id
    identityTenantId: identity.properties.tenantId
    botAppDomain: webApp.properties.defaultHostName
    botDisplayName: botDisplayName
  }
}

output BOT_AZURE_APP_SERVICE_RESOURCE_ID string = webApp.id
output BOT_DOMAIN string = webApp.properties.defaultHostName
output BOT_ID string = identity.properties.clientId
output BOT_TENANT_ID string = identity.properties.tenantId
