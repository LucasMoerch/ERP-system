package com.p3.Enevold.clients;

import com.p3.Enevold.utils.FileDocument;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document("clients")
public class Client {
    @Id
    private String id;
    private String name;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private String notes;
    @CreatedDate
    private Date createdAt;
    @LastModifiedDate
    private Date updatedAt;
    private List<FileDocument> documents = new ArrayList<>();

    // Getters
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getNotes() {
        return notes;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public List<FileDocument> getDocuments() {
        return documents;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setDocuments(List<FileDocument> documents) {
        this.documents = documents;
    }
}
