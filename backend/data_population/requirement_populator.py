# # data_population/requirement_populator.py
# from sqlalchemy.orm import Session
# from app.models import Requirement, Client, Location, Domain, Status, Skill, User
# from app.schemas.requirement import RequirementCreate
# import random
# from datetime import date, timedelta
# import pandas as pd
# import re
# import glob
# import os
# import math


# # Folder path where Excel files are located
# folder_path = '/home/shashank/Bitsilica/Requirement_Manager/Excel_code'

# # Get all Excel files in the folder (with .xlsx extension)
# excel_files = glob.glob(os.path.join(folder_path, "*.xlsx"))

# # Function to extract client, location, and experience (min and max) from text
# def extract_details(text):
#     client = location = min_experience = max_experience = status = expected_start_date = None
#     if isinstance(text, str):
#         print(f"Extracting details from: {text}")  # Debug: Print the raw text being processed

#         client_match = re.search(r'Client:\s*(\w+)', text)
        
#         location_match = re.search(r'Location:\s*([\w\s]+?)(?=\s*Experience)', text)
        
#         experience_match = re.search(r'Experience:\s*(\d+)(?:\s*-\s*(\d+))?', text)
        
#         status_match = re.search(r'Status:\s*(\w+)', text)

#         date_match = re.search(r'Date:\s*(\d{2}-\d{2}-\d{4})', text)

#         client = client_match.group(1) if client_match else None
#         location = location_match.group(1).strip() if location_match else None
        
#         if experience_match:
#             min_experience = int(experience_match.group(1))
#             max_experience = int(experience_match.group(2)) if experience_match.group(2) else min_experience + 5

#         status = status_match.group(1) if status_match else "Active"  # Default status
#         expected_start_date = date_match.group(1) if date_match else None

#         # print(f"Extracted Status: {status}")  # Debug: Print the extracted status
    
#     return client, location, min_experience, max_experience, status, expected_start_date





# def populate_requirements(db: Session):
#     # Pre-fetch clients, locations, domains, statuses, and skills
#     clients = db.query(Client).all()
#     locations = db.query(Location).all()
#     domains = db.query(Domain).all()
#     statuses = db.query(Status).all()
#     skills = db.query(Skill).all()
#     priorities = ["High", "Medium", "Low"]

#     # Fetch the "N/A" entries from the database for missing data
#     na_client = next((c for c in clients if c.name == "N/A"), None)
#     na_location = next((l for l in locations if l.name == "N/A"), None)
#     na_status = next((s for s in statuses if s.name == "N/A"), None)

#     if not na_client or not na_location or not na_status:
#         print("Warning: 'N/A' entries for clients, locations, or statuses are not found in the database.")
#         return

#     # Loop through all Excel files
#     for file in excel_files:
#         print(f"Processing file: {file}")
#         xls = pd.ExcelFile(file)

#         for sheet in xls.sheet_names:
#             df = pd.read_excel(xls, sheet_name=sheet)
            
#             # Apply the extraction function to the relevant column in each sheet
#             df[['Client', 'Location', 'MinExperience', 'MaxExperience', 'Status', 'ExpectedStartDate']] = df.iloc[:, 0].apply(lambda x: pd.Series(extract_details(x)))

#             df_filtered = df[['Client', 'Location', 'MinExperience', 'MaxExperience', 'Status', 'ExpectedStartDate']].dropna(subset=['MinExperience', 'MaxExperience'])
#             df_filtered['Title'] = sheet

#             for _, row in df_filtered.iterrows():
#                 client_name = row['Client'] if row['Client'] else "N/A"
#                 location_name = row['Location'] if row['Location'] else "N/A"
#                 status_name = row['Status'] if row['Status'] else "N/A"
#                 min_experience = row['MinExperience']
#                 max_experience = row['MaxExperience']
#                 expected_start_date = row['ExpectedStartDate'] if pd.notna(row['ExpectedStartDate']) else None

#                 # Map "Open" or "open" to "Active", "Closed" or "closed" to "Closed"
#                 if status_name and status_name.lower() == "open":
#                     status_name = "Active"
#                 elif status_name and status_name.lower() == "closed":
#                     status_name = "Closed"

#                 # Find matching client, location, and status from the database or use 'N/A'
#                 client = next((c for c in clients if c.name == client_name), na_client)
#                 location = next((l for l in locations if l.name == location_name), na_location)
#                 status = next((s for s in statuses if s.name == status_name), na_status)

#                 # Create requirement logic
#                 start_date = (
#                     date.today() + timedelta(days=0)
#                     if expected_start_date is None
#                     else pd.to_datetime(expected_start_date, format='%d-%m-%Y').date()
#                 )
#                 end_date = start_date + timedelta(days=60)  # Fixed duration instead of random

#                 # Default domain to "Embedded"
#                 domain = next((d for d in domains if d.name == "Embedded"), None)
#                 if not domain:
#                     domain = domains[0] if domains else None  # Fallback to the first domain if "Embedded" is not found

#                 # Return empty string for skills if not available
#                 selected_skills =  []  # Fixed selection of the first 5 skills if available

#                 requirement = RequirementCreate(
#                     description=f"Sample requirement for {client.name}",
#                     client_id=client.id,
#                     experience_min=min_experience,
#                     experience_max=max_experience,
#                     location_id=location.id,
#                     domain_id=domain.id,
#                     status_id=status.id,
#                     notes="Sample notes for the requirement",
#                     priority="Medium",  # Fixed priority
#                     expected_start_date=start_date,
#                     expected_end_date=end_date,
#                     required_resources=5,  # Fixed number of required resources
#                     skill_ids=[skill.id for skill in selected_skills] if selected_skills else []
#                 )

#                 db_requirement = Requirement(**requirement.dict(exclude={'skill_ids'}))
#                 db.add(db_requirement)
#                 db.commit()
#                 db.refresh(db_requirement)

#                 for skill_id in requirement.skill_ids:
#                     skill = db.query(Skill).filter(Skill.id == skill_id).first()
#                     if skill:
#                         db_requirement.skills.append(skill)

#                 db.commit()
#                 print(f"Created requirement for {client.name}")



# # If you have a separate function to run the population, keep it:
# def run_requirement_population(db: Session):
#     print("Populating requirements from Excel files...")
#     populate_requirements(db)
#     print("Requirement population completed")







# ** Working Data Population without Date**



# # data_population/requirement_populator.py
# from sqlalchemy.orm import Session
# from app.models import Requirement, Client, Location, Domain, Status, Skill, User
# from app.schemas.requirement import RequirementCreate
# import random
# from datetime import date, timedelta
# import pandas as pd
# import re
# import glob
# import os
# import math


# # Folder path where Excel files are located
# folder_path = '/home/shashank/Bitsilica/Requirement_Manager/Excel_code'

# # Get all Excel files in the folder (with .xlsx extension)
# excel_files = glob.glob(os.path.join(folder_path, "*.xlsx"))

# # Function to extract client, location, and experience (min and max) from text
# def extract_details(text):
#     client = location = min_experience = max_experience = status = expected_start_date = None
#     if isinstance(text, str):
#         print(f"Extracting details from: {text}")  # Debug: Print the raw text being processed

#         client_match = re.search(r'Client:\s*(\w+)', text)
        
#         location_match = re.search(r'Location:\s*([\w\s]+?)(?=\s*Experience)', text)
        
#         experience_match = re.search(r'Experience:\s*(\d+)(?:\s*-\s*(\d+))?', text)
        
#         status_match = re.search(r'Status:\s*(\w+)', text)

#         date_match = re.search(r'Date:\s*(\d{2}-\d{2}-\d{4})', text)

#         client = client_match.group(1) if client_match else None
#         location = location_match.group(1).strip() if location_match else None
        
#         if experience_match:
#             min_experience = int(experience_match.group(1))
#             max_experience = int(experience_match.group(2)) if experience_match.group(2) else min_experience + 5

#         status = status_match.group(1) if status_match else "Active"  # Default status
#         expected_start_date = date_match.group(1) if date_match else None

#         # print(f"Extracted Status: {status}")  # Debug: Print the extracted status
    
#     return client, location, min_experience, max_experience, status, expected_start_date





# def populate_requirements(db: Session):
#     # Pre-fetch clients, locations, domains, statuses, and skills
#     clients = db.query(Client).all()
#     locations = db.query(Location).all()
#     domains = db.query(Domain).all()
#     statuses = db.query(Status).all()
#     skills = db.query(Skill).all()
#     priorities = ["High", "Medium", "Low"]

#     # Fetch the "N/A" entries from the database for missing data
#     na_client = next((c for c in clients if c.name == "N/A"), None)
#     na_location = next((l for l in locations if l.name == "N/A"), None)
#     na_status = next((s for s in statuses if s.name == "N/A"), None)

#     if not na_client or not na_location or not na_status:
#         print("Warning: 'N/A' entries for clients, locations, or statuses are not found in the database.")
#         return

#     # Loop through all Excel files
#     for file in excel_files:
#         print(f"Processing file: {file}")
#         xls = pd.ExcelFile(file)

#         for sheet in xls.sheet_names:
#             df = pd.read_excel(xls, sheet_name=sheet)
            
#             # Apply the extraction function to the relevant column in each sheet
#             df[['Client', 'Location', 'MinExperience', 'MaxExperience', 'Status', 'ExpectedStartDate']] = df.iloc[:, 0].apply(lambda x: pd.Series(extract_details(x)))

#             df_filtered = df[['Client', 'Location', 'MinExperience', 'MaxExperience', 'Status', 'ExpectedStartDate']].dropna(subset=['MinExperience', 'MaxExperience'])
#             df_filtered['Title'] = sheet

#             for _, row in df_filtered.iterrows():
#                 client_name = row['Client'] if row['Client'] else "N/A"
#                 location_name = row['Location'] if row['Location'] else "N/A"
#                 status_name = row['Status'] if row['Status'] else "N/A"
#                 min_experience = row['MinExperience']
#                 max_experience = row['MaxExperience']
#                 expected_start_date = row['ExpectedStartDate'] if pd.notna(row['ExpectedStartDate']) else None

#                 # Map "Open" or "open" to "Active", "Closed" or "closed" to "Closed"
#                 if status_name and status_name.lower() == "open":
#                     status_name = "Active"
#                 elif status_name and status_name.lower() == "closed":
#                     status_name = "Closed"

#                 # Find matching client, location, and status from the database or use 'N/A'
#                 client = next((c for c in clients if c.name == client_name), na_client)
#                 location = next((l for l in locations if l.name == location_name), na_location)
#                 status = next((s for s in statuses if s.name == status_name), na_status)

#                 # Create requirement logic
#                 start_date = (
#                     date.today() + timedelta(days=0)
#                     if expected_start_date is None
#                     else pd.to_datetime(expected_start_date, format='%d-%m-%Y').date()
#                 )
#                 end_date = start_date + timedelta(days=60)  # Fixed duration instead of random

#                 # Default domain to "Embedded"
#                 domain = next((d for d in domains if d.name == "Embedded"), None)
#                 if not domain:
#                     domain = domains[0] if domains else None  # Fallback to the first domain if "Embedded" is not found

#                 # Return empty string for skills if not available
#                 selected_skills =  []  # Fixed selection of the first 5 skills if available

#                 requirement = RequirementCreate(
#                     description=f"Sample requirement for {client.name}",
#                     client_id=client.id,
#                     experience_min=min_experience,
#                     experience_max=max_experience,
#                     location_id=location.id,
#                     domain_id=domain.id,
#                     status_id=status.id,
#                     notes="Sample notes for the requirement",
#                     priority="Medium",  # Fixed priority
#                     expected_start_date=start_date,
#                     expected_end_date=end_date,
#                     required_resources=5,  # Fixed number of required resources
#                     skill_ids=[skill.id for skill in selected_skills] if selected_skills else []
#                 )

#                 db_requirement = Requirement(**requirement.dict(exclude={'skill_ids'}))
#                 db.add(db_requirement)
#                 db.commit()
#                 db.refresh(db_requirement)

#                 for skill_id in requirement.skill_ids:
#                     skill = db.query(Skill).filter(Skill.id == skill_id).first()
#                     if skill:
#                         db_requirement.skills.append(skill)

#                 db.commit()
#                 print(f"Created requirement for {client.name}")



# # If you have a separate function to run the population, keep it:
# def run_requirement_population(db: Session):
#     print("Populating requirements from Excel files...")
#     populate_requirements(db)
#     print("Requirement population completed")






# **Working with Date **




# import pandas as pd
# import re
# import glob
# import os
# from sqlalchemy.orm import Session
# from app.models import Requirement, Client, Location, Domain, Status, Skill, User
# from app.schemas.requirement import RequirementCreate
# from datetime import date, timedelta



# # Specify the folder path containing Excel files
# folder_path = '/home/shashank/Bitsilica/Requirement_Manager/Excel_code/new_Requirements'

# # Get all Excel files in the folder (with .xlsx extension)
# excel_files = glob.glob(os.path.join(folder_path, "*.xlsx"))



# def extract_details(text, status_text, date_text):
#     client = location = min_experience = max_experience = status = expected_start_date = None
    
#     if isinstance(text, str):
#         # Extracting the client name
#         client_match = re.search(r'Client:\s*(\w+)', text)
#         location_match = re.search(r'Location:\s*([\w\s]+?)(?=\s*Experience)', text)
#         experience_match = re.search(r'Experience:\s*(\d+)(?:\s*-\s*(\d+))?', text)

#         # Assigning extracted values
#         client = client_match.group(1) if client_match else None
#         location = location_match.group(1).strip() if location_match else None

#         if experience_match:
#             min_experience = int(experience_match.group(1))
#             max_experience = int(experience_match.group(2)) if experience_match.group(2) else min_experience + 5

#         # Extracting status and date
#         if status_text:
#             status_match = re.search(r'Status:\s*(\w+)', status_text)
#             status = status_match.group(1).strip() if status_match else "Active"

#         if date_text:
#             date_match = re.search(r'Date:\s*(\d{2}-\d{2}-\d{4})', date_text)
#             expected_start_date = pd.to_datetime(date_match.group(1), dayfirst=True).date() if date_match else None

#     return client, location, min_experience, max_experience, status, expected_start_date

# def populate_requirements(db: Session):
#     # Pre-fetch clients, locations, domains, statuses, and skills
#     clients = db.query(Client).all()
#     locations = db.query(Location).all()
#     domains = db.query(Domain).all()
#     statuses = db.query(Status).all()
#     skills = db.query(Skill).all()

#     # Fetch the "N/A" entries from the database for missing data
#     na_client = next((c for c in clients if c.name == "N/A"), None)
#     na_location = next((l for l in locations if l.name == "N/A"), None)
#     na_status = next((s for s in statuses if s.name == "N/A"), None)

#     if not na_client or not na_location or not na_status:
#         print("Warning: 'N/A' entries for clients, locations, or statuses are not found in the database.")
#         return

#     # Loop through all Excel files
#     for file in excel_files:
#         print(f"Processing file: {file}")
#         xls = pd.ExcelFile(file)

#         for sheet_name in xls.sheet_names:
#             # Skip specific sheets by checking for substrings in a case-insensitive manner
#             if any(keyword in sheet_name.lower() for keyword in ["dashboard", "inputs"]):
#                 continue  # Skip to the next iteration
            
#             df = pd.read_excel(xls, sheet_name=sheet_name)
#             first_row = df.head().to_string(index=False)  # Convert the whole first row to string
            
#             # Extract Date and Status from the first row
#             date_match = re.search(r'Date:\s*(\d{2}-\d{2}-\d{4})', first_row)
#             status_match = re.search(r'Status:\s*(\w+)', first_row)

#             # Extracting the status and expected start date
#             status = status_match.group(1).strip() if status_match else "Active"  # Default status
#             expected_start_date = pd.to_datetime(date_match.group(1), dayfirst=True).date() if date_match else None

#             # Now process each row in the DataFrame to extract additional details
#             for index, row in df.iterrows():
#                 # Assuming the first column contains the details we want to extract
#                 details = extract_details(row[0], status, first_row)  # Pass the entire first row for status and date
#                 print(f"Extracted details from row {index}: {details}")

#                 # You can also print or save the status and expected_start_date as needed
#                 print(f"Status: {status}, Expected Start Date: {expected_start_date}")

#                 # Prepare to save the requirement if the necessary data is available
#                 client_name, location_name, min_experience, max_experience, status, expected_start_date = details
                
#                 if min_experience is not None and max_experience is not None:
#                     client_name = client_name if client_name else "N/A"
#                     location_name = location_name if location_name else "N/A"
#                     status_name = status if status else "N/A"
#                     expected_start_date = expected_start_date if pd.notna(expected_start_date) else None

#                     # Map "Open" or "open" to "Active", "Closed" or "closed" to "Closed"
#                     if status_name and status_name.lower() == "open":
#                         status_name = "Active"
#                     elif status_name and status_name.lower() == "closed":
#                         status_name = "Closed"

#                     # Find matching client, location, and status from the database or use 'N/A'
#                     client = next((c for c in clients if c.name == client_name), na_client)
#                     location = next((l for l in locations if l.name == location_name), na_location)
#                     status = next((s for s in statuses if s.name == status_name), na_status)

#                     # Create requirement logic
#                     start_date = (
#                         date.today() + timedelta(days=0)
#                         if expected_start_date is None
#                         else expected_start_date
#                     )
#                     end_date = start_date + timedelta(days=60)  # Fixed duration instead of random

#                     # Default domain to "Embedded"
#                     domain = next((d for d in domains if d.name == "Embedded"), None)
#                     if not domain:
#                         domain = domains[0] if domains else None  # Fallback to the first domain if "Embedded" is not found

#                     # Return empty list for skills if not available
#                     selected_skills = []  # Fixed selection of the first 5 skills if available

#                     requirement = RequirementCreate(
#                         description=f"Sample requirement for {client.name}",
#                         client_id=client.id,
#                         experience_min=min_experience,
#                         experience_max=max_experience,
#                         location_id=location.id,
#                         domain_id=domain.id,
#                         status_id=status.id,
#                         notes="Sample notes for the requirement",
#                         priority="Medium",  # Fixed priority
#                         expected_start_date=start_date,
#                         expected_end_date=end_date,
#                         required_resources=5,  # Fixed number of required resources
#                         skill_ids=[skill.id for skill in selected_skills] if selected_skills else []
#                     )

#                     db_requirement = Requirement(**requirement.dict(exclude={'skill_ids'}))
#                     db.add(db_requirement)
#                     db.commit()
#                     db.refresh(db_requirement)

#                     for skill_id in requirement.skill_ids:
#                         skill = db.query(Skill).filter(Skill.id == skill_id).first()
#                         if skill:
#                             db_requirement.skills.append(skill)

#                     db.commit()
#                     print(f"Created requirement for {client.name}")


# # If you have a separate function to run the population, keep it:
# def run_requirement_population(db: Session):
#     print("Populating requirements from Excel files...")
#     populate_requirements(db)
#     print("Requirement population completed")



# # Read the Excel file (assuming your DataFrame is already created)
# # df = pd.read_excel('your_file.xlsx', sheet_name='your_sheet_name')

# # Assuming df_filled is the DataFrame you've already prepared
# # Extract Date and Status from the merged header
# # Get the merged header value (the first column header)
# date = df_filled.columns[0]  # This should hold the date value
# status = df_filled.columns[0]  # This should hold the status value

# # Create a DataFrame with the extracted Date and Status
# extracted_info = pd.DataFrame({
#     'Date': [date],
#     'Status': [status]
# })

# # Display the extracted DataFrame
# print(extracted_info)

# import pandas as pd
# import re

# # Sample data representing the first row
# full_row_data = (
#     "Date: 21-07-2024            Status: Open    Client: Blaize\n"
#     "Location: Hyderabad\nExperience: 5-8 years\n\n"
#     "Title: Senior Validation Engineer Requirement \n"
#     "Exp:5 to 8+\nLocation: Hyderabad\nKey words:\n\n"
#     "Provided JD:\nJOB RESPONSIBILITIES\n\n"
#     "· Developing test cases for a complex AI Accelerator based on internal development framework.\n"
#     "· Work on Creating DNN and Generative AI based Graph structures.\n"
#     "· Work on Creating Assembly kernels for AI workloads.\n"
#     "· Work with Hardware Design and verification teams closely to develop Test plans and testcases.\n"
#     "· Work on maintaining the test database and regressions\n\n"
#     "REQUIRED KNOWLEDGE, SKILLS, AND ABILITIES\n\n"
#     "Strong Python Programming skills\n\n"
#     "Good C/C++ programming skills\n\n"
#     "Strong software debugging skills\n\n"
#     "Familiarity with Assembly programming.\n\n"
#     "Comfortable with Scripting and Linux work environments.\n\n"
#     "EDUCATION AND EXPERIENCE\n\n"
#     "MS or BS in computer science or related field\n\n"
#     "5-8+ years of software development and validation experience\n\n"
#     "Desired Skills\n\n"
#     "Understanding of Computer architecture, graph processing.\n\n"
#     "Experience with traditional computer vision algorithms and image processing is preferred.\n\n"
#     "Familiarity with DNN’s is also beneficial.\n\n"
#     "Knowledge of test Automation tools and regression setup.\n\n"
#     "Hardware bringup and Validation experience.\n\n"
#     "C/C++ Based hardware verification experience."
# )

# # Regular expressions to extract Date and Status
# date_match = re.search(r'Date:\s*(\d{2}-\d{2}-\d{4})', full_row_data)
# status_match = re.search(r'Status:\s*(\w+)', full_row_data)

# # Extracting values
# extracted_date = date_match.group(1) if date_match else 'None'
# extracted_status = status_match.group(1) if status_match else 'None'

# # Create a DataFrame to hold the extracted values
# extracted_data = pd.DataFrame({'Date': [extracted_date], 'Status': [extracted_status]})

# # Output the extracted data
# print(extracted_data)


import os
import re
import math
import glob
from datetime import date, timedelta
import pandas as pd
from sqlalchemy.orm import Session
from app.models import Requirement, Client, Location, Domain, Status, Skill
from app.schemas.requirement import RequirementCreate

# Folder path where Excel files are located
folder_path = '/home/shashank/Bitsilica/Requirement_Manager/Excel_code/new_Requirements'

# Get all Excel files in the folder (with .xlsx extension)
excel_files = glob.glob(os.path.join(folder_path, "*.xlsx"))

# Function to find the closest multiple of 5
def closest_multiple_of_five(n):
    return int(math.ceil(n / 5.0)) * 5

# Define regex patterns for location and experience
location_pattern = r'(?i)(?:Location:|Location|loc:|loc|Loc:|Loc|Loc-|Location -|)\s*(.*)'
experience_pattern = r'(?i)(?:Exp:|Exp|Experience:|Experience|Experience -|Experience & Qualification|exp|EXPERIENCE:|EXPERIENCE|EXPERIENCE-|Exp -|Exp Min/Max|Min/ Max|Min/Max:)\s*([0-9]+)\s*(?:[-to~\s]+([0-9]+))?\s*(?:years?|yr|yrs|Years?|YEAR|YEARS)?'

# Function to extract and process details from Excel files
# Function to extract data from Excel based on the previous logic
def extract_excel_data(file, sheet_name):
    # Load the Excel file and specific sheet into a DataFrame
    xls = pd.ExcelFile(file)
    df = pd.read_excel(xls, sheet_name=sheet_name)

    # Process the sheet to extract relevant data (client, location, experience, etc.)
    extracted_data = []

    # Define regex patterns for location and experience
    location_pattern = r'(?i)(?:Location:|Location|loc:|loc|Loc:|Work Location - |Loc)\s*(.*)'
    experience_pattern = r'(?i)(?:Exp:|Exp|Experience:|Experience|Experience -|Experience & Qualification|exp|EXPERIENCE:|EXPERIENCE|Exp Min/Max|Min/ Max|Min/Max:)\s*([0-9]+)\s*(?:[-to~\s]+([0-9]+))?\s*(?:years?|yr|yrs|Years?|YEAR|YEARS)?'

    # Initialize a list to store extracted data from the sheet
    all_extracted_data = []

    # Extract data from the first column (header row)
    header_row = df.columns[0]

    # Initialize date and status
    date = 'Unknown'
    status = 'Unknown'

    # Extract Date and Status from the header row using regex split
    if 'Date:' in header_row:
        date_status_split = re.split(r'Date:|Status:', header_row)

        if len(date_status_split) > 1 and date_status_split[1].strip():
            date = date_status_split[1].strip()

        if len(date_status_split) > 2 and date_status_split[2].strip():
            status = date_status_split[2].strip()

    # Initialize location from sheet name based on conditions
    location = 'Unknown'
    if 'BLR' in sheet_name:
        location = 'Bangalore'
    elif 'HYD' in sheet_name:
        location = 'Hyderabad'

    # Extract Location and Experience using regex from the first column
    first_column_data = df.iloc[:, 0].dropna().astype(str)

    # Initialize variables for experience
    min_exp = 'Unknown'
    max_exp = 'Unknown'

    # Loop through the first column data
    for entry in first_column_data:
        location_match = re.search(location_pattern, entry)
        experience_match = re.search(experience_pattern, entry)

        # If regex finds location, it will override the initial value
        if location_match:
            location = location_match.group(1).strip()

     # Check if the experience_match is found and extract min/max experience
        if experience_match:
            min_exp = experience_match.group(1).strip()  # Minimum experience (first group)
            max_exp = experience_match.group(2)  # Maximum experience (optional second group)

            # If max_exp is not found or min_exp is a multiple of 5, calculate next multiple of 5 for max_exp
            if not max_exp:
                min_exp_value = int(min_exp)
                # If min_exp is already a multiple of 5, set max_exp to the next multiple of 5
                if min_exp_value % 5 == 0:
                    max_exp = min_exp_value + 5
                else:
                    max_exp = closest_multiple_of_five(min_exp_value)


    # Prepare the extracted data for the current sheet
    extracted_data.append({
        'Client': os.path.basename(file).split('.')[0],  # Client name from file name
        'Sheet Name': sheet_name,
        'Date': date,
        'Status': status,
        'Location': location,
        'Min Experience': min_exp,
        'Max Experience': max_exp
    })

    # Return as DataFrame
    return pd.DataFrame(extracted_data)


def populate_requirements(db: Session):
    clients = db.query(Client).all()
    locations = db.query(Location).all()
    domains = db.query(Domain).all()
    statuses = db.query(Status).all()
    skills = db.query(Skill).all()
    priorities = ["high", "medium", "low"]

    # Define a location mapping for "Hyd" and "BLR"
    location_mapping = {
        "Hyd": "Hyderabad",
        "BLR": "Bangalore",
        "Bengaluru": "Bangalore",
        "HYD": "Hyderabad",
        "Blr":"Bangalore",
        "Banglore": "Bangalore",
        "BANGALORE": "Bangalore",
        "HYDERABAD": "Hyderabad"
    }

 # Regex pattern to extract just the city name (e.g., "Bangalore" from "Bangalore IN-BLR01-s1")
    location_extraction_pattern = r"^([A-Za-z]+)"

    # Ensure "N/A" location exists in the database
    na_location = db.query(Location).filter(Location.name == "N/A").first()
    if not na_location:
        na_location = Location(name="N/A")
        db.add(na_location)
        db.commit()

    # Ensure "N/A" client exists in the database
    na_client = db.query(Client).filter(Client.name == "N/A").first()
    if not na_client:
        na_client = Client(name="N/A")
        db.add(na_client)
        db.commit()

    # Loop through all Excel files
    for file in excel_files:
        print(f"Processing file: {file}")
        xls = pd.ExcelFile(file)

        # Loop through all sheets to extract the data
        for sheet_name in xls.sheet_names:
            # Skip sheets named 'Dashboard' and 'Inputs' (case-insensitive)
            if sheet_name.lower() in ['dashboard', 'inputs']:
                print(f"Skipping sheet: {sheet_name}")
                continue

            # Extract data from the sheet
            extracted_data_df = extract_excel_data(file, sheet_name)

            # Insert the extracted data into the database using SQLAlchemy
            for _, row in extracted_data_df.iterrows():
                client_name = row['Client']
                location_name = row['Location']
                min_experience = row['Min Experience']
                max_experience = row['Max Experience']

                # Extract the city name before any additional info
                location_match = re.match(location_extraction_pattern, location_name)
                if location_match:
                    location_name = location_match.group(1).strip()

                # Map "Hyd" to "Hyderabad" and "BLR" to "Bangalore"
                if location_name in location_mapping:
                    location_name = location_mapping[location_name]

                # Find the matching client from the database
                client = next((c for c in clients if c.name == client_name), None)
           
                 # If client is 'Viseton', set the location as 'Chennai'
                if client_name.lower() == 'viseton':
                    location_name = 'Chennai'

                # If client is not found, default to "N/A"
                if client is None:
                    print(f"Client not found: {client_name}. Defaulting to 'N/A'.")
                    client_name = "N/A"
                    client_id = na_client.id  # Use the ID of the N/A client
                else:
                    client_id = client.id  # Get the client ID

                # Find the matching location from the database or use "N/A" if not found
                location = next((l for l in locations if l.name == location_name), na_location)

                # Use the "N/A" location ID if the original location is not found
                location_id = location.id  

                # Set default values if necessary
                if min_experience == 'Unknown':
                    min_experience = 0  # Default to 0 if unknown
                else:
                    min_experience = int(min_experience)

                if max_experience == 'Unknown':
                    max_experience = min_experience + 5  # Default max experience to min + 5 if unknown
                else:
                    max_experience = int(max_experience)

                # Set default domain and status if not found
               
                status = statuses[0].id if statuses else None

                  # Default domain to "Embedded"
                domain = next((d for d in domains if d.name == "Embedded"), None)
                if not domain:
                    domain = domains[0] if domains else None  # Fallback to the first domain if "Embedded" is not found

                # Prepare the requirement data without skill_ids
                requirement_data = {
                    "description": f"Requirement from {row['Sheet Name']}",
                    "client_id": client_id,  # Use client_id which might be None
                    "experience_min": min_experience,
                    "experience_max": max_experience,
                    "location_id": location_id,  # Use location_id which is guaranteed to be valid
                    "domain_id": domain.id,
                    "status_id": status,
                    "notes": "Automatically populated requirement",
                    "priority": priorities[0],  # Set a default priority
                    "expected_start_date": date.today(),
                    "expected_end_date": date.today() + timedelta(days=30),  # Set a default end date 30 days from today
                    "required_resources": 1  # Default to 1 resource
                }

                # Create a new Requirement instance and add it to the session
                db_requirement = Requirement(**requirement_data)
                db.add(db_requirement)
                db.commit()  # Commit the new requirement

                print(f"Created requirement for {client_name}")

# If you have a separate function to run the population, keep it:
def run_requirement_population(db: Session):
    print("Populating requirements from Excel files...")
    populate_requirements(db)
    print("Requirement population completed")