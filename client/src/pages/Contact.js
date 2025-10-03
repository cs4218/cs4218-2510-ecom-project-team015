import React from "react";
import Layout from "./../components/Layout";
import { BiMailSend, BiPhoneCall, BiSupport } from "react-icons/bi";

const Contact = () => {
  return (
    <Layout title={"Contact Us - Ecommerce app"}>
      <div className="row contactus ">
        <h1 className="bg-dark p-2 text-white text-center">CONTACT US</h1>
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="Contact Us Image"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p className="text-justify mt-2">
            For any query or info about product, feel free to call anytime. We are
            available 24X7.  
          </p>
          <p className="mt-3">
            <BiMailSend data-testid="email-icon"/> : www.help@ecommerceapp.com
          </p>
          <p className="mt-3">
            <BiPhoneCall data-testid="phone-icon"/> : 012-3456789
          </p>
          <p className="mt-3">
            <BiSupport data-testid="support-icon"/> : 1800-0000-0000 (Toll Free)
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;