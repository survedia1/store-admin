import React, { useState, useEffect, useRef } from "react";
// لم نعد بحاجة لـ axios للرفع، الودجت يتكفل بذلك
// لكن قد تحتاجه إذا كنت تستخدمه لأمور أخرى، هنا سنستخدم fetch للسيرفر

// إعدادات Cloudinary
const CLOUD_NAME = "dc35epopt"; 
const UPLOAD_PRESET = "mystore";

const AppForm = ({ currentApp, onCancel, onSuccess }) => {
  // بيانات النموذج
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  
  // الروابط (نخزن الرابط مباشرة بدلاً من الملف)
  const [iconUrl, setIconUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // حالات التحميل والحفظ
  const [isSaving, setIsSaving] = useState(false);
  const cloudinaryRef = useRef();
  const widgetRef = useRef();

  // تعبئة البيانات عند التعديل
  useEffect(() => {
    if (currentApp) {
      setName(currentApp.name);
      setPackageName(currentApp.packageName);
      setVersion(currentApp.version);
      setDeveloperName(currentApp.developerName);
      setDescription(currentApp.description);
      setSize(currentApp.size);
      setIconUrl(currentApp.iconUrl);
      setDownloadUrl(currentApp.downloadUrl);
    }
  }, [currentApp]);

  // تهيئة مكتبة Cloudinary عند فتح الصفحة
  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
  }, []);

  // دالة تحويل الحجم من بايت إلى ميجابايت
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // دالة فتح نافذة الرفع (Generic)
  const handleOpenWidget = (type) => {
    const isApk = type === 'apk';
    
    // إعدادات الودجت
    const widgetConfig = {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      // تحديد نوع المورد: raw للتطبيقات، image للأيقونات
      resourceType: isApk ? 'raw' : 'image', 
      folder: 'apps', // مجلد فرعي في كلودنيري
      sources: ['local', 'url', 'google_drive'], // مصادر الرفع
      multiple: false, // ملف واحد فقط
      clientAllowedFormats: isApk ? ['apk', 'xapk'] : ['png', 'jpg', 'jpeg', 'webp'],
      maxFileSize: isApk ? 150000000 : 5000000, // 150MB للـ APK و 5MB للصورة
      styles: {
        palette: {
          window: "#FFFFFF",
          windowBorder: "#90A0B3",
          tabIcon: "#01875F",
          menuIcons: "#5A616A",
          textDark: "#000000",
          textLight: "#FFFFFF",
          link: "#01875F",
          action: "#FF620C",
          inactiveTabIcon: "#0E2F5A",
          error: "#F44235",
          inProgress: "#0078FF",
          complete: "#20B832",
          sourceBg: "#E4EBF1"
        }
      }
    };

    widgetRef.current = cloudinaryRef.current.createUploadWidget(widgetConfig, (error, result) => {
      if (!error && result && result.event === "success") {
        console.log("تم الرفع بنجاح:", result.info);
        
        if (isApk) {
          setDownloadUrl(result.info.secure_url);
          // ميزة إضافية: تعبئة حجم التطبيق تلقائياً
          setSize(formatBytes(result.info.bytes));
        } else {
          setIconUrl(result.info.secure_url);
        }
      }
    });

    widgetRef.current.open();
  };

  // دالة الحفظ النهائي في قاعدة البيانات
  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من البيانات
    if (!iconUrl || !downloadUrl) {
      alert("الرجاء التأكد من وجود الأيقونة ورابط التطبيق.");
      return;
    }

    setIsSaving(true);

    const appData = {
      name,
      developerName,
      iconUrl,
      downloadUrl, 
      packageName,
      version, // هذا هو أهم حقل للتحديث
      size,
      description,
      rating: currentApp ? currentApp.rating : 4.5,
      screenshots // إرسال الصور
    };

    try {
      // تحديد الرابط والطريقة (Method)
      const baseUrl = 'http://localhost:3000/apps'; // تأكد من البورت
      
      // إذا كان هناك currentApp يعني نحن في وضع التعديل
      const url = currentApp ? `${baseUrl}/${currentApp.id}` : baseUrl;
      const method = currentApp ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });

      if (response.ok) {
        alert(currentApp ? "تم تحديث التطبيق بنجاح!" : "تم إضافة التطبيق بنجاح!");
        onSuccess(); 
      } else {
        const errorData = await response.json();
        alert("فشل العملية: " + (errorData.error || "خطأ غير معروف"));
      }
    } catch (error) {
      console.error("Error saving app:", error);
      alert("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="form-container">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        {currentApp ? "تعديل بيانات التطبيق" : "إضافة تطبيق جديد"}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#01875F' }}>رابط تحميل التطبيق (APK Direct Link)</label>
          <input 
            type="url" 
            value={downloadUrl} 
            onChange={(e) => setDownloadUrl(e.target.value)} 
            placeholder="https://drive.google.com/uc?export=download&id=..."
            style={{ direction: 'ltr', textAlign: 'left' }} // لضمان ظهور الرابط بشكل صحيح
            required 
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            لجوجل درايف استخدم الصيغة: <code>https://drive.google.com/uc?export=download&id=YOUR_FILE_ID</code>
          </small>
        </div>
        
        {/* حقل الحجم: بما أننا لن نرفع ملفًا، يجب إدخال الحجم يدويًا */}
         <div className="form-group">
            <label>حجم التطبيق (مثال: 18 MB)</label>
            <input 
              type="text" 
              value={size} 
              onChange={(e) => setSize(e.target.value)} 
              placeholder="18 MB"
              required 
            />
        </div>

        <div className="row">
          <div className="form-group">
            <label>الإصدار (Version)</label>
            <input 
              type="text" 
              value={version} 
              onChange={(e) => setVersion(e.target.value)} 
              placeholder="1.0.0"
              required 
            />
          </div>
          <div className="form-group">
            <label>اسم المطور</label>
            <input 
              type="text" 
              value={developerName} 
              onChange={(e) => setDeveloperName(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="row">
            <div className="form-group">
                <label>الحجم (يُحسب تلقائياً)</label>
                <input 
                type="text" 
                value={size} 
                onChange={(e) => setSize(e.target.value)} 
                placeholder="سيظهر هنا بعد رفع الملف"
                />
            </div>
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea 
            rows="4" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </div>

        {/* منطقة رفع الأيقونة */}
        <div className="form-group" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>صورة الأيقونة</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
                type="button" 
                onClick={() => handleOpenWidget('image')} 
                className="btn-upload"
                style={{
                    backgroundColor: '#e0e0e0', border: '1px solid #ccc', 
                    padding: '8px 15px', borderRadius: '4px', cursor: 'pointer'
                }}
            >
                📷 رفع الأيقونة
            </button>
            
            {iconUrl ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <img src={iconUrl} alt="Icon Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                    <span style={{ color: 'green', fontWeight: 'bold' }}>✅ تم الرفع</span>
                </div>
            ) : <span style={{color: '#999'}}>لم يتم اختيار صورة</span>}
          </div>
        </div>

        {/* منطقة رفع ملف APK */}
        <div className="form-group" style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px dashed #01875F' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#01875F', fontWeight: 'bold' }}>ملف التطبيق (APK)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
                type="button" 
                onClick={() => handleOpenWidget('apk')} 
                className="btn-upload"
                style={{
                    backgroundColor: '#01875F', color: 'white', border: 'none', 
                    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer'
                }}
            >
                🚀 رفع ملف الـ APK
            </button>
            
            {downloadUrl ? (
                <div>
                    <span style={{ display: 'block', color: 'green', fontWeight: 'bold' }}>✅ الملف جاهز!</span>
                    <small style={{ color: '#666', wordBreak: 'break-all' }}>{downloadUrl.substring(0, 30)}...</small>
                </div>
            ) : <span style={{color: '#666'}}>يدعم ملفات حتى 100+ ميجابايت</span>}
          </div>
        </div>

        <div className="buttons" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button type="submit" className="btn-save" disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? "جاري الحفظ..." : "حفظ ونشر التطبيق"}
          </button>
          <button type="button" onClick={onCancel} className="btn-cancel" disabled={isSaving}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppForm;