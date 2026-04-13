import json
import uuid
import re
from urllib.parse import urlparse

def parse_measure(measure):
    if not measure or not measure.strip():
        return 0.0, ""
    
    measure = measure.strip().lower()
    
    # Try to find a number at the start
    # Matches: 1, 1.5, 1/2, 1 1/2
    match = re.match(r'^(\d+\s+\d+/\d+|\d+/\d+|\d+\.\d+|\d+)', measure)
    if match:
        num_str = match.group(1)
        unit = measure[len(num_str):].strip()
        
        # Convert num_str to float
        try:
            if '/' in num_str:
                if ' ' in num_str:
                    whole, frac = num_str.split(' ')
                    num, den = frac.split('/')
                    val = float(whole) + float(num) / float(den)
                else:
                    num, den = num_str.split('/')
                    val = float(num) / float(den)
            else:
                val = float(num_str)
            return round(val, 2), unit
        except:
            return 0.0, measure
    else:
        return 0.0, measure

def get_source_name(url):
    if not url:
        return "TheMealDB"
    try:
        domain = urlparse(url).netloc
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain or "TheMealDB"
    except:
        return "TheMealDB"

# Load the recipes (I'll paste the data here in a real scenario, but since I have it in history, 
# I'll just simulate the processing logic and write the final SQL)
# Actually, I can't easily "paste" it into the tool call if it's huge, 
# so I'll read the output from the previous turn if I could, 
# but I'll just write a script that would handle the JSON if I piped it.
# Wait, I can just write the logic and then use it.

def generate_sql(recipes_json):
    recipes = json.loads(recipes_json)
    user_id = 'admin-user-id'
    
    sql_lines = [
        "-- Seed TheMealDB Recipes",
        "BEGIN TRANSACTION;"
    ]
    
    for recipe in recipes[:50]:
        recipe_id = str(uuid.uuid4())
        title = recipe['strMeal'].replace("'", "''")
        instructions = recipe['strInstructions'].replace("'", "''")
        image_url = recipe['strMealThumb']
        source_url = recipe.get('strSource', '') or ''
        source_name = get_source_name(source_url).replace("'", "''")
        source_url = source_url.replace("'", "''")
        
        # Simple description from title
        description = f"A delicious recipe for {recipe['strMeal']}.".replace("'", "''")
        
        sql_lines.append(f"INSERT INTO recipes (id, user_id, title, description, instructions, image_url, servings, source_url, source_name) VALUES ('{recipe_id}', '{user_id}', '{title}', '{description}', '{instructions}', '{image_url}', 4, '{source_url}', '{source_name}');")
        
        # Ingredients
        for i in range(1, 21):
            ing_name = recipe.get(f'strIngredient{i}')
            if not ing_name or not ing_name.strip():
                continue
            
            measure = recipe.get(f'strMeasure{i}', '')
            qty, unit = parse_measure(measure)
            
            ing_id = str(uuid.uuid4())
            ing_name = ing_name.replace("'", "''")
            unit = unit.replace("'", "''")
            
            sql_lines.append(f"INSERT INTO ingredients (id, recipe_id, name, quantity, unit) VALUES ('{ing_id}', '{recipe_id}', '{ing_name}', {qty}, '{unit}');")
        
        # Dietary Tags (1-10)
        # We need 1-2 tags. Let's use a simple deterministic-ish way based on title length or something, 
        # or just random-ish enough for a seed.
        import zlib
        seed = zlib.crc32(recipe['strMeal'].encode())
        tag1 = (seed % 10) + 1
        sql_lines.append(f"INSERT INTO recipe_dietary_tags (recipe_id, tag_id) VALUES ('{recipe_id}', {tag1});")
        if seed % 2 == 0:
            tag2 = ((seed // 10) % 10) + 1
            if tag2 != tag1:
                sql_lines.append(f"INSERT INTO recipe_dietary_tags (recipe_id, tag_id) VALUES ('{recipe_id}', {tag2});")
                
    sql_lines.append("COMMIT;")
    return "\n".join(sql_lines)

# I will write the processor to a file and then run it with the data.
