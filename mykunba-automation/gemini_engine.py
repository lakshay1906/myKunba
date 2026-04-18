import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_blog_content(trend_keyword):
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    prompt = f"""
    Role: You are a Senior Full-Stack Engineer and Lead Author for 'My Kunba', a technical blog.
    Task: Write a high-quality, SEO-optimized blog post based on the trending topic: '{trend_keyword}'.
    
    Requirements:
    1. Connect the trend to a technical concept (e.g., Performance, AWS, Next.js, or Software Architecture).
    2. Tone: Authoritative, helpful, and developer-centric.
    3. Structure: 
       - Catchy H1 Title.
       - Introduction (The 'Why').
       - 3 Key Technical Takeaways.
       - Conclusion.
    4. Format: Return the response as a JSON object with 'title', 'content_html', and 'image_prompt'.
    
    Constraint: Ensure the content is original and adds value beyond just news reporting.
    """
    
    response = model.generate_content(prompt)
    # Note: Use response.text and parse as JSON for clean automation
    return response.text