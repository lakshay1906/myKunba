import os
import json
from datetime import datetime
from fetch_trends import tr
from gemini_engine import generate_blog_content

def save_response(data):
    # 1. Ensure the 'responses' folder exists
    folder_name = "responses"
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    
    # 2. Create a unique filename using the current timestamp
    # Format: 2026-04-16_20-15-30_response.json
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{timestamp}_response.json"
    filepath = os.path.join(folder_name, filename)
    
    # 3. Save the data to the file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"Successfully saved response to: {filepath}")

def main():
    try:
        # Fetch trends (existing logic)
        trends = tr.trending_now(geo='US')
        top_trend = trends[0].keyword
        print(f"Working on trend: {top_trend}")

        # Get AI content (existing logic)
        ai_response_text = generate_blog_content(top_trend)
        
        # Parse the string response into a Python dictionary
        blog_data = json.loads(ai_response_text)
        
        # Save locally instead of posting to CMS
        save_response(blog_data)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()