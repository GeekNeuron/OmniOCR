cmake_minimum_required(VERSION 3.10.2)
project(OCRBridge)

add_library(
    OCRBridge
    SHARED
    OcrBridge.cpp
)

find_library(
    log-lib
    log
)

# Link Tesseract and Leptonica
find_library(tesseract-lib tesseract REQUIRED)
find_library(leptonica-lib lept REQUIRED)

include_directories(
    include
    ${CMAKE_SOURCE_DIR}/../jniLibs/include
)

target_link_libraries(
    OCRBridge
    ${log-lib}
    tesseract
    lept
)
