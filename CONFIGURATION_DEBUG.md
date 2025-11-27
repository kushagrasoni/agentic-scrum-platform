# Configuration Persistence Debugging Guide

## Issue: Configuration showing "openai" instead of "azure"

### Root Cause Fixed ✅
Changed `config-store.ts` initialState from `apiMode: 'openai'` to `apiMode: null` to prevent hardcoded default from overriding saved configuration.

---

## Steps to Resolve

### 1. Clear Browser Cache & LocalStorage

**Option A: Clear specific localStorage key (Recommended)**
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** in left sidebar
4. Click on `http://localhost:3000`
5. Find the key `agentic-scrum-config`
6. Right-click → **Delete**
7. Refresh the page (F5)

**Option B: Clear all site data**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data** button
4. Check: Local storage, Session storage, Cache
5. Click **Clear site data**
6. Close and reopen browser tab

---

### 2. Verify Clean State

Open browser console (F12 → Console tab) and run:
```javascript
localStorage.getItem('agentic-scrum-config')
```

**Expected Result**: `null` or empty

If you see data, it means cache wasn't cleared properly.

---

### 3. Configure Azure OpenAI

Use your credentials from `env.txt`:

**Form Values:**
- **API Mode**: Select "Azure OpenAI"
- **Endpoint**: `https://genaipoc-apimgmtservices.azure-api.net/`
- **Deployment Name**: `gpt-5-mini`
- **API Key**: `0fa8c6a860d4484795d9d273c150d5d9`
- **API Version**: `2024-02-01`

**Steps:**
1. Go to http://localhost:3000/configure
2. Select "Azure OpenAI" tab
3. Fill in all fields
4. Click **Test Connection**
5. Wait for success message
6. Navigate to **Execute** page

---

### 4. Verify Persistence

**Check localStorage (Console):**
```javascript
JSON.parse(localStorage.getItem('agentic-scrum-config'))
```

**Expected Output:**
```json
{
  "state": {
    "apiMode": "azure",
    "azureConfig": {
      "apiKey": "0fa8c6a860d4484795d9d273c150d5d9",
      "endpoint": "https://genaipoc-apimgmtservices.azure-api.net/",
      "deployment": "gpt-5-mini",
      "apiVersion": "2024-02-01"
    }
  },
  "version": 0
}
```

**Check Execute Page:**
- Should show "Azure OpenAI" badge (NOT "openai")
- Status card should display:
  - ✅ Active Configuration
  - Provider: Azure OpenAI
  - Deployment: gpt-5-mini
  - Endpoint: genaipoc-apimgmtservices.azure-api.net
  - API Key: 0fa8c6a8... (masked)

---

### 5. Test Navigation Persistence

1. Go to **Execute** page → verify Azure config shows
2. Navigate to **History** page
3. Navigate back to **Execute** page
4. Verify config still shows "Azure OpenAI"
5. Go to **Configure** page
6. Verify form fields still populated with Azure values

---

## Debugging Commands

### Check what's in localStorage
```javascript
// Browser Console (F12)
console.log('Current config:', localStorage.getItem('agentic-scrum-config'));
console.log('Parsed:', JSON.parse(localStorage.getItem('agentic-scrum-config')));
```

### Force set Azure config (temporary workaround)
```javascript
// Browser Console - Use ONLY for testing
const testConfig = {
  state: {
    apiMode: "azure",
    azureConfig: {
      apiKey: "0fa8c6a860d4484795d9d273c150d5d9",
      endpoint: "https://genaipoc-apimgmtservices.azure-api.net/",
      deployment: "gpt-5-mini",
      apiVersion: "2024-02-01"
    },
    ollamaConfig: { baseUrl: "http://localhost:11434", model: "llama2" },
    openaiConfig: { apiKey: "", model: "gpt-4" }
  },
  version: 0
};

localStorage.setItem('agentic-scrum-config', JSON.stringify(testConfig));
location.reload(); // Refresh page
```

### Clear localStorage programmatically
```javascript
// Browser Console
localStorage.removeItem('agentic-scrum-config');
location.reload();
```

---

## What Changed in the Fix

### Before (Bug):
```typescript
// config-store.ts - Line 56
apiMode: 'openai' as ApiMode  // ❌ Hardcoded default
```

**Problem**: Even when user saved Azure config to localStorage, Zustand's persist middleware would merge it with initialState defaults. Since `apiMode` had a hardcoded 'openai' value, it would always default to that.

### After (Fixed):
```typescript
// config-store.ts - Line 56
apiMode: null as ApiMode | null  // ✅ No default

// Type updates
interface ConfigState {
  apiMode: ApiMode | null;  // Line 27 - allows null
  setApiMode: (mode: ApiMode | null) => void;  // Line 47
}
```

**Solution**: No provider is selected until user explicitly configures one. Follows Azure Portal pattern.

---

## Expected Behavior After Fix

### First Visit (No Config)
- **Configure page**: All tabs empty, no provider selected
- **Execute page**: Alert shows "No configuration detected" + "Configure Now" button

### After Configuring Azure
- **Configure page**: Azure tab selected, all fields filled
- **Execute page**: Green checkmark card shows "Azure OpenAI" with deployment details

### After Page Refresh
- **All pages**: Azure configuration persists
- **localStorage**: Contains full Azure config object
- **No reversion** to "openai"

---

## Troubleshooting

### Issue: Still showing "openai" after clearing cache
**Solution**: 
1. Close ALL browser tabs for localhost:3000
2. Close browser completely
3. Reopen browser and navigate to http://localhost:3000
4. Verify localStorage empty before configuring

### Issue: Form fields empty after refresh
**Possible Cause**: useEffect not firing
**Check**: Open React DevTools → Components → find ConfigurePage → verify props/state

### Issue: Test Connection fails
**Possible Causes**:
1. Azure APIM endpoint requires specific headers
2. API key incorrect
3. Deployment name mismatch

**Solution**: Check backend logs:
```powershell
# In the terminal running uvicorn
# Look for POST /api/config/test-connection errors
```

### Issue: Configuration saves but Execute page doesn't update
**Possible Cause**: Zustand store not syncing
**Check**: 
```javascript
// Browser Console
window.__ZUSTAND__ // Should show current store state
```

---

## Next Steps After Verification

Once configuration persists correctly:

1. **Test Agent Execution**: Run a simple task with Azure OpenAI
2. **Monitor Backend Logs**: Verify it uses Azure endpoint, not OpenAI
3. **Check API Calls**: DevTools → Network tab → filter by "azure-api.net"
4. **Phase 1 Enhancements**: Begin implementing SSE streaming for real-time progress

---

## Support

If issues persist after following this guide:
1. Export localStorage content (console command above)
2. Check browser console for React errors
3. Verify both frontend/backend servers running
4. Check if any service workers interfering (DevTools → Application → Service Workers → Unregister)
