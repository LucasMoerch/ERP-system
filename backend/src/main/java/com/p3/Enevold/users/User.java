package com.p3.Enevold.users;

import com.p3.Enevold.utils.FileDocument;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document("users")
public class User {
    @Id
    private String id;

    private List<String> roles; // Either "staff" or "admin"
    private String status; // "invited" | "active" | "disabled"
    private Auth auth;
    private Profile profile;
    @CreatedDate
    private Date createdAt;
    @LastModifiedDate
    private Date updatedAt;
    @CreatedBy
    private String createdBy;

    public static class Auth {
        private String provider = "google";
        @Indexed(unique = true, sparse = true)
        private String sub; // null until activate
        @Indexed(unique = true)
        private String email; // must be unique
        private boolean emailVerified;
        private String pictureUrl;

        // getters/setters
        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getSub() {
            return sub;
        }

        public void setSub(String sub) {
            this.sub = sub;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public boolean isEmailVerified() {
            return emailVerified;
        }

        public void setEmailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
        }

        public String getPictureUrl() {
            return pictureUrl;
        }

        public void setPictureUrl(String pictureUrl) {
            this.pictureUrl = pictureUrl;
        }
    }

    public static class Profile {
        private String firstName;
        private String lastName;
        private String displayName;
        private String phone;
        private String locale;
        private String birthDate;
        private String address;
        private String cpr;
        private String bankReg;
        private String bankNumber;

        // getters/setters
        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getLocale() {
            return locale;
        }

        public void setLocale(String locale) {
            this.locale = locale;
        }

        public String getBirthDate() {
            return birthDate;
        }

        public void setBirthDate(String birthDate) {
            this.birthDate = birthDate;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCPR() {
            return cpr;
        }

        public void setCPR(String cpr) {
            this.cpr = cpr;
        }

        public String getBankReg() {
            return bankReg;
        }

        public void setBankReg(String bankReg) {
            this.bankReg = bankReg;
        }

        public String getBankNumber() {
            return bankNumber;
        }

        public void setBankNumber(String bankNumber) {
            this.bankNumber = bankNumber;
        }
    }

    // getters/setters
    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }


    private List<FileDocument> documents = new ArrayList<>();

    // root getters/setters
    public String getId() {
        return id;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Auth getAuth() {
        return auth;
    }

    public void setAuth(Auth auth) {
        this.auth = auth;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public List<FileDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<FileDocument> documents) {
        this.documents = documents;
    }
}
