package com.p3.Enevold.cases;

import com.p3.Enevold.utils.FileDocument;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document("cases")
public class Case {

    @Id
    private String id;
    private String clientId;
    private String title;
    private String description;
    private String status;
    private List<String> assignedUserIds;
    @CreatedDate
    private Date createdAt;
    @LastModifiedDate
    private Date updatedAt;

    @CreatedBy
    private String createdBy;

    private List<FileDocument> documents = new ArrayList<>();

    // getters and setters
    public String getId() {
        return id;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(List<String> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public List<FileDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<FileDocument> documents) {
        this.documents = documents;
    }
}
