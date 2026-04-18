from trendspy import Trends

tr = Trends()
print("Fetching daily trending searches in United States...")

try:
    trends = tr.trending_now(geo='US')
    
    for i, item in enumerate(trends[:5]):
        # Modern 2026 fix: 
        # Most trendspy objects now store the keyword in 'keyword' or 'query'
        # We also check the internal __dict__ if those fail
        topic = getattr(item, 'keyword', getattr(item, 'query', None))
        
        if not topic and hasattr(item, '__dict__'):
            # This looks at all data the object is hiding
            topic = item.__dict__.get('keyword') or item.__dict__.get('title')

        print(f"{i+1}. {topic or 'Trending Topic'}")

except Exception as e:
    print(f"Connection failed: {e}")