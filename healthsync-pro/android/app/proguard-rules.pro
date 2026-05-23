# HealthSync Pro — ProGuard / R8 Rules for Production Release
# These rules prevent stripping of classes needed at runtime

# ─── React Native core ────────────────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.react.**

# ─── Native methods ───────────────────────────────────────────────────────
-keepclassmembers class * {
    native <methods>;
}

# ─── OkHttp / Okio ────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ─── Gson ─────────────────────────────────────────────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ─── React Native Reanimated ──────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }

# ─── React Native Gesture Handler ────────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }

# ─── React Native Screens ─────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ─── React Native Image Picker ────────────────────────────────────────────
-keep class com.imagepicker.** { *; }

# ─── React Native Keychain ────────────────────────────────────────────────
-keep class com.oblador.keychain.** { *; }

# ─── React Native Push Notifications ─────────────────────────────────────
-keep class com.dieam.reactnativepushnotification.** { *; }

# ─── React Native Linear Gradient ────────────────────────────────────────
-keep class com.BV.LinearGradient.** { *; }

# ─── React Native Safe Area Context ──────────────────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ─── React Native WebView ─────────────────────────────────────────────────
-keep class com.reactnativecommunity.webview.** { *; }

# ─── React Native Async Storage ───────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── Firebase ─────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ─── Google Sign-In / Play Services ──────────────────────────────────────
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ─── Razorpay ─────────────────────────────────────────────────────────────
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ─── App classes ──────────────────────────────────────────────────────────
-keep class com.healthsyncpro.** { *; }

# ─── Annotations & debug info ─────────────────────────────────────────────
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# ─── Keep exception classes for crash reporting ───────────────────────────
-keep public class * extends java.lang.Exception

# ─── Strip verbose logs in release ────────────────────────────────────────
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# ─── Suppress warnings for unused libraries ───────────────────────────────
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
