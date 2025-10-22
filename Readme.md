# CS4218 Project - Virtual Vault

[![CI Status](https://img.shields.io/badge/CI-Link-brightgreen)](https://github.com/cs4218/cs4218-2510-ecom-project-team015/actions/runs/18257276719/job/51980387829)

## Project Contributions
## Milestone 1
| Name | Client Related Files (/client/src/) | Server Related Files (./) | Remarks |
| :---- | :---- | :---- | :---- |
| ADHITYA GOPALAKRISHNAN | <ul><li>Private.js</li><li>UserMenu.js</li><li>Dashboard.js</li><li>Orders.js</li><li>Profile.js</li><li>Users.js</li><li>HomePage.js <ul><li>getTotal</li><li>loadMore</li><li>handleFilter</li></ul></li><ul> | <ul><li>userModel.js</li><li>orderModel.js</li><li>controllers/authController.js<ul><li>updateProfileController</li><li>getOrdersController</li><li>getAllOrdersController</li><li>orderStatusController</li><li>getAllUsersController</li></ul></li></ul> | I have used ChatGPT for some of the mocks and to generate tests. I have specified it near the code where applicable. |
| RAVI KISHORE | <ul><li>auth.js</li><li>Register.js</li><li>Login.js</li><li>ForgotPassword.js</li><li>Contact.js</li><li>Policy.js</li></ul> | <ul><li>authHelper.js</li><li>authMiddleware.js</li><li>authController.js<ul><li>registerContoller</li><li>loginController</li><li>forgotPasswordController</li><li>testController</li></ul></li></ul> | I have used ChatGPT to debug, generate and brainstorm for some test cases. |
| SINHA VEDANT | <ul><li>components/Footer.js</li><li>components/Header.js</li><li>components/Layout.js</li><li>components/Spinner.js</li><li>pages/About.js</li><li>pages/Pagenotfound.js</li><li>context/cart.js</li><li>CartPage.js</li><li>hooks/useCategory.js</li><li>pages/Categories.js</li></ul> | <ul><li>config/db.js</li><li>models/categoryModel.js</li><li>controllers/categoryController.js<ul><li>categoryControlller</li><li>singleCategoryController</li></ul><li>controllers/productController.js<ul><li>braintreeTokenController</li><li>braintreePaymentController</li></ul> | I have used ChatGPT and Claude to generate/edit/debug my test cases. I have mentioned the use of AI at line number 1 of each testfile I wrote. |
| TRAN ANH KHOA | <ul><li>components/Form/SearchInput.js</li><li>context/search.js</li><li>pages/Search.js</li><li>pages/ProductDetails.js</li><li>pages/CategoryProduct.js</li><li>pages/HomePage.js</li></ul> | <ul><li>controllers/productController.js<ul><li>getProductController</li><li>getSingleProductController</li><li>productPhotoController</li><li>productFiltersController</li><li>productCountController</li><li>productListController</li><li>searchProductController</li><li>realtedProductController</li><li>productCategoryController</li></ul></li><li>models/productModel.js</li></ul> | I used ChatGPT to write many components for writing unit tests. I've mentioned the used of AI in the files I had ChatGPT for help.  |
| UJJWAL GAURAV | <ul><li>AdminMenu.js</li><li>AdminDashboard.js</li><li>AdminOrders.js</li><li>Products.js</li><li>CategoryForm.js</li><li>CreateCategory.js</li><li>CreateProduct.js</li><li>UpdateProduct.js</li></ul> | <ul><li>controllers/categoryController.js<ul><li>createCategoryController</li><li>updateCategoryController</li><li>deleteCategoryController</li></ul><li>controllers/productController.js<ul><li>createProductController</li><li>updateProductController</li><li>deleteProductController</li></ul> | I used ChatGPT for some of the components for writing tests, stubs, and mocks. I’ve mentioned the use of ChatGPT in these components in a comment above each code written by AI.  |

## Milestone 2
## Adhitya Gopalakrishnan:
### Frontend Integration Tests:
1. userMenu.integration.test.js
2. profile.integration.test.js
3. dashboard.integration.test.js
### Backend Integration Tests:
1. adminUsers.integration.test.js
2. orders.integration.test.js
3. updateProfile.integration.test.js
### UI tests:
1. adminUsers.spec.js
2. Dashboard.spec.js
3. profile.spec.js
4. UserMenu.spec.js
5. Orders.spec.js
### E2E tests:
1. DashboardProfileUsermenu-e2e.spec.js
2. Orders-e2e.spec.js
### Miscellaneous:
1. Add config files for integration tests
2. Setup mongodb in-memory server for UI tests.

Note: I have used ChatGPT to generate some mocks, tests and config files.

## Ravi Kishore:
### Frontend Integration Tests:
1. register.integration.test.js
2. login.integration.test.js
3. forgotPassword.integration.test.js
### Backend Integration Tests:
1. registration.integration.test.js
2. login.integration.test.js
3. forgotPassword.integration.test.js
4. middleware.integration.test.js
5. End2End.integration.test.js
### UI tests:
1. forgotPassword.spec.js
2. login.spec.js
3. register.spec.js
4. contact.spec.js
5. policy.spec.js
### E2E tests:
1. registerForgotPasswordLoginHomeLogout.spec.js
### Miscellaneous:
1. Set up SonarQube scanner
2. Written code coverage report

Note: I have used ChatGPT to generate some mocks, tests and config files.

## Vedant Sinha
### Integration Tests:
1. cartpage-payment.integration.test.js
2. e2e-cart-payment-order.integration.test.js
3. payment-cartdb.integration.test.js
4. payment-orderdb.integration.test.js
5. categoryController.integration.test.js

### UI Tests:
1. Category.spec.js
2. Footer.spec.js
3. Header.spec.js
4. Layout.spec.js
5. Spinner.spec.js
6. About.spec.js

### Miscellaneous/Bug Fix: Added Cart database instead of just local storage:
1. cartModel.js
2. cartRoutes.js
3. cartController.js
4. Modified CartPage.js and context/cart.js

Note: I have used ChatGPT and Claude while writing tests and I have credited them at the top of each relevant file.

## Ujjwal Gaurav:  
### UI Tests (Playwright):  
1. adminLoginAndPermissionsWorkflow.spec.js  
2. adminOrdersWorkflow.spec.js  
3. createProductWorkflow.spec.js  
4. updateProductWorkflow.spec.js  
*(Helper: adminSetup.js)*  

### Integration Tests: 
1. AdminDashboard.integration.test.js  
2. AdminMenu.integration.test.js  
3. AdminOrders.integration.test.js  
4. Products.integration.test.js  
5. CreateProduct.integration.test.js  
6. UpdateProduct.integration.test.js  
7. productController.integration.test.js  

### Miscellaneous:
1. Identified 4 bugs and fixed 2 during integration and UI testing.  
2. Assisted in generating deterministic test data and improving Playwright reliability.  

Note: I have used ChatGPT to generate some mocks, tests and config files.

## Tran Anh Khoa
### Frontend Integration Tests
1. loginHomeCart.integration.test.js  
2. loginHomeFilter.integration.test.js  
3. loginHomeProductDetails.integration.test.js  
4. loginHomeSearch.integration.test.js  

### UI Tests
1. homepage.spec.js  

### Miscellaneous
1. Fixed a typo bug and make payment bug
2. Created mock API utilities and context provider setups for tests

Note: I used ChatGPT to create some visual reports and tests

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
