<a name="_hlk188882845"></a><a name="reporttitle"></a>Style Guidelines for Final Year Project Reports**Online DRC**

**Design Document**

**Version 1.0**



![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.001.png)



** 

**Group ID: F24PROJECT1A165 (BC200405673)**

**Supervisor Name:** **Haseeb Akmal (haseebakmal@vu.edu.pk)***	 










**

**Revision History**

|**Date (dd/mm/yyyy)**|**Version**|**Description**|**Author**|
| :-: | :-: | :-: | :-: |
|27/01/2025|1\.0|<p>This document outlines various aspects of the application, including its design and implementation structure:</p><p>- Introduction</p><p>- Entity-Relationship Diagram (ERD)</p><p>- Sequence Diagram</p><p>- Architecture Diagram</p><p>- Class Diagram</p><p>- Database Diagram</p><p>- Interface Design</p><p>- Test Cases</p>|BC200405673|
|||||
|||||
|||||























**Table of Contents**


**										                       

1. [Introduction of Design Document](#_introduction_of_design)			      
1. [Entity Relationship Diagram (ERD)](#erd)
1. [Sequence Diagrams](#six)	
1. [Architecture Design Diagram](#seven) 	
1. [Class Diagram	](#class)				
1. [Database Design](#databasedesign)
1. [Interface Design](#interfacedesign)
1. [Test Cases](#testcases)				
**\

















<a name="four"></a><a name="erd"></a>**Design Document**


1. # <a name="scope"></a><a name="_introduction_of_design"></a><a name="_hlk156495019"></a>**Introduction of Design Document:**
This phase includes the following components:

- Entity Relationship Diagram (ERD)
- Sequence Diagram
- Architecture Design Diagram
- Class Diagram
- Database Design
- Interface Design
- Test Cases
  1. ## **Entity Relationship Diagram (ERD)**
The ERD visually depicts the relationships between entities in a given scenario. An entity is an independently existing object uniquely identified by a primary key.
1. ## **Sequence Diagrams**
Sequence Diagrams illustrate the flow of messages and interactions between the user and objects/classes. It can also be seen as a logical representation of system development.
1. ## **Architecture Design Diagram**
The Architecture Design Diagram visually represents the structure of the budget planner in layered form, including the Application Layer, Business Logic Layer, and Data Link Layer.
1. ## **Class Diagram**
A Class Diagram provides a static overview of all classes, their attributes, methods, and relationships with other classes. It uses UML diagram techniques to represent the classes within the system.
1. ## **Database Design**
This section outlines the backend database structure, showing data organized into tables and rows. It also illustrates the logical design of databases and the relationships between tables.
1. ## **Interface Design**
To simplify interaction with the complex backend structure, we use a Graphical User Interface (GUI). This visually designed interface allows users to interact with the application easily.
1. ## **Test Cases**
Test Cases represent the functionalities and features of the online budget planner application, ensuring that each feature or function works correctly. Test cases are executed using various conditions and tools.



1. # <a name="_hlk156495366"></a><a name="_hlk156495339"></a>**Entity Relationship Diagram (ERD):**


![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.002.png)


1. # <a name="_hlk156498251"></a><a name="six"></a>**Sequence Diagrams:**

1. ## <a name="_hlk156496593"></a>**Registration and Profile Management:** 

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.003.png)


1. ## **Search Plants:** 

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.004.png)
1. ## **Personalized Plant Care Recommendations:**

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.005.png)


1. ## **Plant Tracking and Monitoring:**

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.006.png)




1. ## **Interactive Tools and Resources:**

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.007.png)





1. ## **Community Features:** 

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.008.png)





1. ## **Alerts:**

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.009.png)


1. ## **Integration with External Services:** 

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.010.png)
1. # <a name="_hlk156498671"></a>**Architecture Design Diagram:**


![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.011.jpeg)
1. # <a name="_hlk156498910"></a>**Class Diagram:**
![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.012.png)


1. # **Database Design:**

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.013.png)




1. # <a name="_hlk156499526"></a>**Interface Design:**

Some conceptual screenshots (GUI) of the system are as follow:
1. ## **Login Screen:** 

![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.014.png)





1. ## <a name="_hlk156499737"></a>**Signup Screen:**


![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.015.png)




1. ## **Admin Dashboard Screen:** 


![](Aspose.Words.387c9faa-6e7a-405a-bcad-6ce63292c178.016.jpeg)
1. # **Test Cases:**

1. ## **Registration:** 

|<h1>**Test Case #1**</h1>|**Registration**|
| :- | :- |
|Preconditions|The user must not have an existing account.|
|Actions|<p>The user navigates to the registration page.</p><p>Fills in the required information (name, email, role, password).</p><p>Submits the form.</p><p>The system validates the data and saves the user profile.</p><p>A confirmation message is shown to the user.</p>|
|Expected Results|A confirmation message is displayed, and the user account is created successfully.|
|Tested By |Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

1. ## **Login:** 

|**Test Case #2**|**Login**|
| :- | :- |
|Preconditions|The user must already be registered.|
|Actions|<p>The user navigates to the login page.</p><p>Enters email and password.</p><p>The system verifies credentials.</p><p>If correct, the user is logged in and redirected to their dashboard.</p>|
|Expected Results|The user is successfully logged into the system.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|


1. ## **Update Profile:** 

|**Test Case #3**|**Update Profile**|
| :- | :- |
|Preconditions|The user must be logged in.|
|Actions|<p>The user navigates to the profile section.</p><p>Updates personal information or preferences.</p><p>Submits the changes.</p><p>The system validates and saves the updates.</p>|
|Expected Results|The profile is updated successfully.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

1. ## **View Plant Database:** 

|**Test Case #4**|**View Plant Database**|
| :- | :- |
|Preconditions|The user must be logged in.|
|Actions|<p>The user navigates to the plant database.</p><p>Browses the available plants.</p><p>Selects a plant to view detailed information.</p>|
|Expected Results|The user can view plant details.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|


1. ## **Search Plants:** 

|**Test Case #5**|**Search Plants**|
| :- | :- |
|Preconditions|The user must be logged in.|
|Actions|<p>The user enters a search query.</p><p>The system processes the query and fetches matching results.</p><p>Results are displayed to the user.</p>|
|Expected Results|Search results are displayed.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

1. ## **Receive Care Recommendations:** 

|**Test Case #6**|**Receive Care Recommendations**|
| :- | :- |
|Preconditions|The user must have a plant registered in the system.|
|Actions|<p>The user views care recommendations.</p><p>The system generates advice based on plant type, location, and climate.</p><p>Displays recommendations such as watering schedules and pest control tips.</p>|
|Expected Results|The user receives care recommendations.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|


1. ## **Track Plant Growth:** 

|**Test Case #7**|**Track Plant Growth**|
| :- | :- |
|Preconditions|The user must have a plant registered in the system.|
|Actions|<p>The user records plant observations.</p><p>The system logs and updates the growth data.</p><p>The user can review historical growth data.</p>|
|Expected Results|Plant growth data is recorded and accessible.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

1. ## **Receive Notifications:** 

|**Test Case #8**|**Receive Notifications**|
| :- | :- |
|Preconditions|The user must have a registered account.|
|Actions|<p>The system sends relevant notifications.</p><p>The user views and acts upon notifications.</p>|
|Expected Results|Notifications are delivered successfully.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|<a name="_hlk156500078"></a>Pass/Fail|


1. ## <a name="_hlk156500088"></a>**Manage Plants (Admin):** 

|**Test Case #9**|**Manage Plants**|
| :- | :- |
|Preconditions|The admin must be logged in.|
|Actions|<p>The admin navigates to the plant management section.</p><p>Adds, updates, or deletes plants.</p><p>Changes are saved to the database.</p>|
|Expected Results|The database is updated.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

1. ## ` `**Manage Educational Content (Admin):** 

|**Test Case #10**|**Manage Educational Content**|
| :- | :- |
|Preconditions|The admin must be logged in.|
|Actions|<p>The admin navigates to the educational content section.</p><p>Adds, updates, or deletes resources.</p><p>Changes are saved.</p>|
|Expected Results|Educational content is updated.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|


1. ## ` `**Manage Community Forum (Admin):** 

|**Test Case #11**|**Manage Community Forum**|
| :- | :- |
|Preconditions|The admin must be logged in.|
|Actions|<p>The admin reviews posts and discussions.</p><p>Approves, edits, or deletes content as necessary.</p>|
|Expected Results|The community forum is moderated.|
|Tested By|Muhammad Abu Bakar (BC200405673)|
|Result|Pass/Fail|

