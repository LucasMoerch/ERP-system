package com.p3.Enevold.admin;

import java.util.List;

// This DTO defines the expected JSON body for the invitation request
public class InvitationRequest {
    private String email;
    private List<String> roles;

    private String fullName;
    private String phone;
    private String address;
    private String cpr;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCPR() { return cpr; }
    public void setCPR(String cpr) { this.cpr = cpr; }
}
