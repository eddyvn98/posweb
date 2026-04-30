/**
 * Google Drive Backup Service
 * Tự động lưu file Excel báo cáo lên Google Drive
 * Structure: /OpenPOS-Backups/{shop_name}/{year}/{month}/Bao-cao-POS-MM-YYYY.xlsx
 */

/**
 * Lấy Google Drive API instance từ access token
 */
export const getDriveApi = async (accessToken) => {
    if (!accessToken) {
        throw new Error('Google Drive access token không tìm thấy')
    }
    
    const gapi = window.gapi
    if (!gapi) {
        throw new Error('Google API library chưa load')
    }
    
    // Set authorization
    gapi.client.setApiKey(accessToken)
    await gapi.client.load('drive', 'v3')
    
    return gapi.client.drive
}

/**
 * Tạo folder nếu không tồn tại, trả về folder ID
 * Path: /OpenPOS-Backups/Cua-hang-ABC/2026/01
 */
export const ensureFolderExists = async (accessToken, shopName, year, month) => {
    try {
        const drive = await getDriveApi(accessToken)
        
        // Tạo path
        const parentId = 'root'
        const folders = [
            'OpenPOS-Backups',
            shopName,
            year.toString(),
            month.toString().padStart(2, '0')
        ]
        
        let currentParentId = parentId
        
        for (const folderName of folders) {
            // Tìm folder con
            const response = await drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and parents in '${currentParentId}'`,
                spaces: 'drive',
                pageSize: 1,
                fields: 'files(id, name)'
            })
            
            let folderId = response.result.files?.[0]?.id
            
            // Nếu không có, tạo folder mới
            if (!folderId) {
                const createResponse = await drive.files.create({
                    resource: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [currentParentId]
                    },
                    fields: 'id'
                })
                folderId = createResponse.result.id
            }
            
            currentParentId = folderId
        }
        
        return currentParentId
    } catch (err) {
        console.error('Lỗi tạo folder Drive:', err)
        throw err
    }
}

/**
 * Upload file Excel lên Google Drive
 * Trả về { fileId, fileName, fileSize }
 */
export const uploadToDrive = async (
    accessToken,
    excelBlob,
    fileName,
    shopName,
    year,
    month,
    description = ''
) => {
    try {
        const drive = await getDriveApi(accessToken)
        
        // Ensure folder tồn tại
        const folderId = await ensureFolderExists(accessToken, shopName, year, month)
        
        // Upload file
        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify({
            name: fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            parents: [folderId],
            description: description || `Báo cáo ${month}/${year} - ${shopName}`
        })], { type: 'application/json' }))
        form.append('file', excelBlob)
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`
            }),
            body: form
        })
        
        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Upload thất bại: ${error.error?.message || response.statusText}`)
        }
        
        const result = await response.json()
        
        return {
            fileId: result.id,
            fileName: result.name,
            fileSize: result.size || excelBlob.size,
            folderPath: folderId,
            webViewLink: result.webViewLink
        }
    } catch (err) {
        console.error('Lỗi upload Drive:', err)
        throw err
    }
}

/**
 * Tạo public link (tùy chọn - không cần trong MVP)
 */
export const makeFilePublic = async (accessToken, fileId) => {
    try {
        const drive = await getDriveApi(accessToken)
        
        await drive.permissions.create({
            fileId: fileId,
            resource: {
                role: 'reader',
                type: 'anyone'
            }
        })
        
        return true
    } catch (err) {
        console.warn('Không thể set public link:', err)
        return false
    }
}

/**
 * Mở folder trên Drive (desktop)
 */
export const openDriveFolder = (folderId) => {
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank')
}
