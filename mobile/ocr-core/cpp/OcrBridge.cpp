#include <jni.h>
#include <string>
#include <tesseract/baseapi.h>
#include <leptonica/allheaders.h>

extern "C"
JNIEXPORT jstring JNICALL
Java_org_omniocr_ocrcore_OcrBridge_runOcr(
        JNIEnv *env,
        jobject /* this */,
        jstring imagePath_,
        jstring langCode_) {

    const char *imagePath = env->GetStringUTFChars(imagePath_, 0);
    const char *langCode = env->GetStringUTFChars(langCode_, 0);

    tesseract::TessBaseAPI tess;
    if (tess.Init(NULL, langCode)) {
        return env->NewStringUTF("Error: Could not initialize tesseract.");
    }

    Pix *image = pixRead(imagePath);
    if (!image) {
        return env->NewStringUTF("Error: Could not read image.");
    }

    tess.SetImage(image);
    const char *outText = tess.GetUTF8Text();

    jstring result = env->NewStringUTF(outText);
    tess.End();
    pixDestroy(&image);
    env->ReleaseStringUTFChars(imagePath_, imagePath);
    env->ReleaseStringUTFChars(langCode_, langCode);
    return result;
}
