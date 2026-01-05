# Firebase 設置說明

為了讓所有用戶都能看到共享的投票數據，您需要設置 Firebase 實時數據庫。

## 步驟 1: 創建 Firebase 項目

1. 訪問 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「添加項目」或「創建項目」
3. 輸入項目名稱（例如：vote-app）
4. 按照提示完成項目創建

## 步驟 2: 啟用實時數據庫

1. 在 Firebase Console 中，選擇您的項目
2. 點擊左側菜單的「實時數據庫」（Realtime Database）
3. 點擊「創建數據庫」
4. 選擇「以測試模式啟動」（用於開發，生產環境需要設置安全規則）
5. 選擇數據庫位置（建議選擇離您最近的區域）

## 步驟 3: 獲取配置信息

1. 在 Firebase Console 中，點擊項目設置（齒輪圖標）
2. 滾動到「您的應用程序」部分
3. 點擊「Web」圖標（</>）來添加 Web 應用
4. 輸入應用名稱（例如：投票小程序）
5. 複製配置對象

## 步驟 4: 更新 script.js

打開 `script.js` 文件，找到以下部分：

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

將 `YOUR_API_KEY`、`YOUR_PROJECT_ID` 等替換為您從 Firebase Console 複製的實際值。

## 步驟 5: 設置數據庫安全規則（可選但推薦）

在 Firebase Console 的「實時數據庫」>「規則」中，設置以下規則：

```json
{
  "rules": {
    "votes": {
      ".read": true,
      ".write": true
    }
  }
}
```

**注意**：這個規則允許任何人讀寫數據。在生產環境中，您應該設置更嚴格的安全規則。

## 管理員密碼

默認管理員密碼是 `admin123`。您可以在 `script.js` 文件中修改 `ADMIN_PASSWORD` 常量來更改密碼。

## 功能說明

- **管理員**：可以創建投票和查看所有投票
- **普通用戶**：只能查看和參與投票，無法創建投票
- **數據同步**：所有用戶看到的投票數據都是實時同步的
- **備用方案**：如果未配置 Firebase，系統會自動使用本地存儲（但數據不會共享）

## 故障排除

如果遇到問題：

1. 檢查瀏覽器控制台是否有錯誤信息
2. 確認 Firebase 配置信息是否正確
3. 確認實時數據庫已啟用
4. 檢查網絡連接是否正常

