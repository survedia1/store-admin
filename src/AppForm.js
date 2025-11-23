import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import axios from "axios"; // 1. استيراد axios

// ⬇️⬇️ بيانات Cloudinary ⬇️⬇️
const CLOUD_NAME = "dc35epopt"; 
const UPLOAD_PRESET = "mystore";
// ⬆️⬆️ ----------------- ⬆️⬆️

const AppForm = ({ currentApp, onCancel, onSuccess }) => {
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  
  const [iconFile, setIconFile] = useState(null);
  const [apkFile, setApkFile] = useState(null);
  const [currentIconUrl, setCurrentIconUrl] = useState("");
  const [currentApkUrl, setCurrentApkUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // 2. متغير جديد لتخزين نسبة التحميل
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (currentApp) {
      setName(currentApp.name);
      setPackageName(currentApp.packageName);
      setVersion(currentApp.version);
      setDeveloperName(currentApp.developerName);
      setDescription(currentApp.description);
      setSize(currentApp.size);
      setCurrentIconUrl(currentApp.iconUrl);
      setCurrentApkUrl(currentApp.downloadUrl);
    }
  }, [currentApp]);

  // 3. دالة الرفع المعدلة باستخدام axios
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    // تصفير العداد قبل البدء
    setUploadProgress(0);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          // ميزة axios لمتابعة الرفع
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );
      return response.data.secure_url;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalIconUrl = currentIconUrl;
      let finalApkUrl = currentApkUrl;

      // رفع الأيقونة
      if (iconFile) {
        setStatusMessage("جاري رفع الأيقونة...");
        finalIconUrl = await uploadToCloudinary(iconFile);
      }

      // رفع APK
      if (apkFile) {
        setStatusMessage("جاري رفع ملف التطبيق (APK)...");
        const sizeInMB = (apkFile.size / (1024 * 1024)).toFixed(1) + " MB";
        setSize(sizeInMB);
        finalApkUrl = await uploadToCloudinary(apkFile);
      }

      setStatusMessage("جاري حفظ البيانات في قاعدة البيانات...");
      
      const appData = {
        name,
        packageName,
        version,
        developerName,
        description,
        size: apkFile ? ((apkFile.size / (1024 * 1024)).toFixed(1) + " MB") : size,
        iconUrl: finalIconUrl,
        downloadUrl: finalApkUrl,
        rating: 4.5,
      };

      if (currentApp) {
        await updateDoc(doc(db, "apps", currentApp.id), appData);
      } else {
        await addDoc(collection(db, "apps"), appData);
      }

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("حدث خطأ: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isUploading) {
    return (
      <div className="upload-screen">
        <h3>{statusMessage}</h3>
        
        {/* 4. عرض شريط التقدم والنسبة المئوية */}
        {uploadProgress > 0 && (
            <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                <p style={{ direction: "ltr", fontWeight: "bold" }}>
                    {uploadProgress}%
                </p>
            </div>
        )}
        
        <p>الرجاء عدم إغلاق الصفحة...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>{currentApp ? "تعديل التطبيق" : "إضافة تطبيق جديد"}</h2>
      <form onSubmit={handleSubmit}>
        {/* ... باقي حقول النموذج كما هي بدون تغيير ... */}
        <div className="form-group">
          <label>اسم التطبيق</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        
        <div className="form-group">
          <label>Package Name</label>
          <input type="text" value={packageName} onChange={(e) => setPackageName(e.target.value)} required />
        </div>

        <div className="row">
          <div className="form-group">
            <label>الإصدار</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>اسم المطور</label>
            <input type="text" value={developerName} onChange={(e) => setDeveloperName(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="form-group file-input">
          <label>صورة الأيقونة</label>
          <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files[0])} />
          {currentIconUrl && <img src={currentIconUrl} alt="icon" width="50" />}
        </div>

        <div className="form-group file-input">
          <label>ملف التطبيق (APK)</label>
          <input type="file" accept=".apk" onChange={(e) => setApkFile(e.target.files[0])} />
          {currentApkUrl && <span className="badge">يوجد ملف حالياً</span>}
        </div>

        <div className="buttons">
          <button type="submit" className="btn-save">حفظ ونشر</button>
          <button type="button" onClick={onCancel} className="btn-cancel">إلغاء</button>
        </div>
      </form>
    </div>
  );
};

export default AppForm;