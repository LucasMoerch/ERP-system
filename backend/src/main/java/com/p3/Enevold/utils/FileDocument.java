package com.p3.Enevold.utils;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Date;

public class FileDocument {
    private String fileName;
    private String contentType;
    @JsonIgnore
    private byte[] data; // Don't serialize the raw binary data
    private Date uploadedAt;
    private String createdBy;

    // Getters
    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }

    public Date getUploadedAt() {
        return uploadedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    // Setters
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public void setUploadedAt(Date uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
