@@ -35,6 +35,7 @@ CREATE TABLE IF NOT EXISTS profiles (
     avatar_url TEXT,
     profile_image_url TEXT,
     phone TEXT,
+    country_code TEXT,
     bio TEXT,
     location TEXT,
     is_email_verified BOOLEAN DEFAULT FALSE,