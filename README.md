![image](https://github.com/Twitter-Clone-Project/Back-End/assets/94763036/f4fbb928-9e3f-4faf-aa22-52107e415257)

# X-Clone Backend

X-Clone Backend is a scalable backend repository for building X (tweeter) APIs. It provides a solid foundation for developing features like user authentication, post creation, following/follower relationships, notifications, and more.

## 🧑🏼‍💻 Tech Stack

-   NodeJS
-   ExpressJs
-   PostgreSQL
-   TypeORM

## APIs Documentation

File API-Documentation.yaml in the repo, this is a yaml coded-documentation. Untill we upload the documentation on swaagerHub($$), you can see the GUI by opening [swagger editor](https://editor-next.swagger.io/) online, then paste the code in it.


You can also see postman documentation with test exambles [here](https://documenter.getpostman.com/view/23936176/2s9YXe8jiV) 
## Project MVC Architecture
 - Model (M):
The Model represents the data layer and business logic.
The Model is responsible for interacting with the PostgreSQL database, which includes querying, updating, and managing data.
It encapsulates the logic related to database connections, data validation, and data manipulation, similar to the previous explanation.

 - No View (V):
In a RESTful API context, there's typically no dedicated View component for rendering HTML or other content. Instead, the View is represented by the data that the API returns in JSON format.

- Controller (C):
The Controller remains the intermediary between the Model and client requests, but it's adapted to handle API endpoints.
It handles incoming HTTP requests from clients, such as GET, POST, PUT, or DELETE requests, and determines how to respond with JSON data.
The Controller interacts with the Model to retrieve or update data, prepares the data for JSON responses, and sends those responses to clients.

#### Simplified flow of how MVC can work with our RESTful APIs:
1. A client makes an HTTP request to the server, such as a GET request to fetch data from the database through an API endpoint.
2. The Controller receives the request, identifies the requested action, and interacts with the Model.
3. The Model communicates with the PostgreSQL database to retrieve the requested data.
4. The Model returns the data to the Controller.
5. The Controller prepares a JSON response with the data received from the Model.
6. The Controller sends the JSON response back to the client as an HTTP response.
7. The client application (e.g., a web or mobile frontend) receives and processes the JSON data for display or further use.

<hr>

## Design Patterns
1. MVC (Model-View-Controller): Which is a fundamental architectural pattern. It helps separate concerns and maintain code organization.
2. Factory Method Pattern: This pattern abstracts the creation of objects, providing flexibility in object creation. We will make a factory controller that is a generic controller handling common CRUD operations. Based on the calling entity, it will decide which one.
3. Singleton Pattern: For certain resources or components that should have a single instance throughout the application's lifecycle, such as a database connection pool or a configuration manager.
4. Middleware Pattern: In Express.js, Middleware allows you to process requests and responses in a sequential manner.
5. Observer Pattern: In chat (Socket.io), the server acts as the observable subject, and connected clients (users) act as observers. When a user sends a message, the server notifies all users in the same chat room (observers) by broadcasting the message. This decouples the sender from the receivers, allowing real-time communication and updates in a chat room.
6. Decorator Pattern: For adding additional functionality or security checks to the authentication process without modifying the core authentication code. This is particularly helpful when applying multiple layers of authentication, authorization checks, or other security-related features to user authentication.
7. Strategy Pattern: The selection of some code strategy is determined based on the current environment.
8. SOLID Principles:
   
 - Single Responsibility Principle (SRP):
 In our project, the SRP encourages each module to have a single responsibility. For example, controllers in your MVC structure should be responsible for handling user requests and responding with data, while models should focus on data manipulation and database interactions. This separation of concerns ensures that each component has a clear, distinct purpose.
   
-  Open-Closed Principle (OCP):
  The OCP suggests that our code should be open for extension but closed for modification. When we need to add new features or endpoints, we can do so by extending your existing controllers or services without modifying the core implementation. This can be achieved by adhering to the principles of route separation, middleware usage, and service encapsulation.
   
- Dependency Inversion Principle (DIP):
 The DIP encourages the use of dependency injection to decouple high-level modules (controllers, routes) from low-level modules (services, models). By injecting dependencies through constructor injection or by using a dependency injection container, you can invert the control of dependencies and achieve more modular and testable code.

<hr>

## Run Locally

Clone the project

```bash
  https://github.com/Twitter-Clone-Project/Back-End.git
```

Install dependencies. `cd to the project folder that has the package.json file in it.`

```bash
  npm install
```

Start the server in development env

```bash
  npm run start:dev
```

Start the server in production env

```bash
  npm run start:prod
```

## Authors

-   Mahmoud Yahia [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/mahmoud-yahia-882144219/)
-   Mohamed Yaser [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/mohamed-yasser-952280226/)
-   Daniel Nabil [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/daniel-atallah01/)
-   Mostafa Tarek [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)]()
