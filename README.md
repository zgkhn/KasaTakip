# 💰 İş Yeri Para Yönetim Uygulaması

Bu uygulama, bir işyerinde toplanan paranın yönetilmesini sağlayan bir kayıt defteri sistemidir. Üyeler harcamaları ve kasa durumunu görebilirken, adminler kimin para verdiğini takip edebilir ve giderleri fişleriyle birlikte kayıt altına alabilir.

## 🚀 Özellikler

- 📌 **Üyeler** harcamaları ve kasa durumunu görüntüleyebilir.
- ✅ **Admin** kullanıcılar, kimlerin ödeme yaptığını takip edebilir.
- 📂 **Fiş yükleme** desteği ile giderler belgelenebilir.
- 📊 **Aylık bazda raporlama** ile harcamalar ve ödemeler incelenebilir.
- 🔒 **Güvenli kimlik doğrulama** ve veri yönetimi.

---

## 🛠️ Teknik Detaylar

- **Frontend:** React + Vite
- **Backend & Database:** [Supabase](https://supabase.com/)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel / Netlify (isteğe bağlı)

---

## 🏗️ Veritabanı Yapısı

### 📌 `profiles` (Kullanıcı Profilleri)
| Alan Adı  | Veri Türü | Açıklama |
|-----------|----------|----------|
| `id` | `uuid` | Kullanıcının benzersiz kimliği |
| `full_name` | `text` | Kullanıcının tam adı |
| `is_admin` | `bool` | Admin olup olmadığını belirten değer |
| `created_at` | `timestamptz` | Hesap oluşturulma tarihi |
| `updated_at` | `timestamptz` | Hesap güncellenme tarihi |
| `username` | `text` | Kullanıcı adı |
| `email` | `text` | Kullanıcı e-posta adresi |

### 📌 `expenses` (Harcamalar)
| Alan Adı  | Veri Türü | Açıklama |
|-----------|----------|----------|
| `id` | `uuid` | Harcamanın benzersiz kimliği |
| `description` | `text` | Harcamanın açıklaması |
| `amount` | `numeric` | Harcamanın miktarı |
| `expense_date` | `date` | Harcamanın tarihi |
| `created_at` | `timestamptz` | Kaydın oluşturulma tarihi |
| `created_by` | `uuid` | Harcamayı ekleyen kullanıcının ID'si |
| `image_url` | `text` | Harcama fişinin URL'si |

### 📌 `payments` (Ödemeler)
| Alan Adı  | Veri Türü | Açıklama |
|-----------|----------|----------|
| `id` | `uuid` | Ödemenin benzersiz kimliği |
| `created_at` | `timestamptz` | Ödemenin oluşturulma tarihi |
| `user_id` | `uuid` | Ödemeyi yapan kullanıcının kimliği |
| `amount` | `numeric` | Ödenen miktar |
| `payment_date` | `date` | Ödemenin yapıldığı tarih |
| `payment_month` | `date` | Ödemenin ait olduğu ay |
| `created_by` | `uuid` | Kaydı oluşturan kullanıcının kimliği |

### 📌 `payments_backup` (Ödeme Yedekleri)
Ödemelerin yedeklenmiş versiyonu.

| Alan Adı  | Veri Türü | Açıklama |
|-----------|----------|----------|
| `id` | `uuid` | Ödemenin benzersiz kimliği |
| `user_id` | `uuid` | Ödemeyi yapan kullanıcının kimliği |
| `amount` | `numeric` | Ödenen miktar |
| `payment_date` | `date` | Ödemenin yapıldığı tarih |
| `payment_month` | `date` | Ödemenin ait olduğu ay |
| `created_at` | `timestamptz` | Kaydın oluşturulma tarihi |
| `created_by` | `uuid` | Kaydı oluşturan kullanıcının kimliği |

---

## 🎯 SQL Kodları

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    is_admin BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    image_url TEXT
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_month DATE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE payments_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_month DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

---

## 🔑 Supabase Ortam Değişkenleri

```env
VITE_SUPABASE_URL="https://your-supabase-url.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 📜 Kurulum ve Çalıştırma

```bash
git clone https://github.com/zgkhn/KasaTakip.git
cd proje-adi
npm install
cp .env.example .env
npm run dev
```

Tarayıcınızda **http://localhost:5173** adresinde çalıştırabilirsiniz. 🎉
