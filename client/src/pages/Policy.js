import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy - Ecommerce app"}>
      <div className="row privacy-policy ">
        <h1 className="bg-dark p-2 text-white text-center">Privacy Policy</h1>
        <div className="col-md-10">
          <h3>Effective Date: 4 October 2025</h3>
          <p>
            We value your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our e-commerce application.
          </p>

          <h4>1. Information We Collect</h4>
          <p>
            We may collect personal details like name, email, phone number, address, date of birth, and payment information.
          </p>

          <h4>2. How We Use Your Information</h4>
          <p>
            We use your information to process orders, provide customer support, improve services, send updates, and ensure secure payments.
          </p>

          <h4>3. Sharing of Information</h4>
          <p>
            We do not sell your data. We only share it with service providers (payment, shipping) or when legally required.
          </p>

          <h4>4. Data Security</h4>
          <p>
            We use reasonable measures to protect your data but cannot guarantee complete security.
          </p>

          <h4>5. Your Rights</h4>
          <p>
            You can access, update, or delete your information, and request a copy of your data.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;