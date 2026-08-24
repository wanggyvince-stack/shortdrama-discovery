"""
Database utilities for the scraper
Handles importing scraped data into the database
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from typing import List, Dict
from datetime import datetime

# We'll use SQLite directly for the scraper
# since Prisma client is for Node.js
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'prisma', 'dev.db')


def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug[:100]


def import_dramas(dramas: List[Dict]) -> int:
    """Import dramas into database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    imported = 0
    skipped = 0
    
    for drama in dramas:
        try:
            slug = generate_slug(drama['title'])
            
            # Check if drama already exists
            cursor.execute("SELECT id FROM Drama WHERE sourceId = ? AND source = ?", 
                         (drama['sourceId'], drama['source']))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing drama
                cursor.execute("""
                    UPDATE Drama SET
                        title = ?,
                        synopsis = ?,
                        coverUrl = ?,
                        score = ?,
                        readCount = ?,
                        collectCount = ?,
                        chapterCount = ?,
                        sourceUrl = ?,
                        lastScrapedAt = ?
                    WHERE id = ?
                """, (
                    drama['title'],
                    drama.get('synopsis'),
                    drama.get('coverUrl'),
                    drama.get('score'),
                    drama.get('readCount'),
                    drama.get('collectCount'),
                    drama.get('chapterCount'),
                    drama.get('sourceUrl'),
                    datetime.now().isoformat(),
                    existing['id']
                ))
                drama_id = existing['id']
                skipped += 1
            else:
                # Insert new drama
                import uuid
                drama_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO Drama (
                        id, sourceId, source, title, slug, synopsis, coverUrl,
                        score, readCount, collectCount, chapterCount, sourceUrl,
                        createdAt, updatedAt, lastScrapedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    drama_id,
                    drama['sourceId'],
                    drama['source'],
                    drama['title'],
                    slug,
                    drama.get('synopsis'),
                    drama.get('coverUrl'),
                    drama.get('score'),
                    drama.get('readCount'),
                    drama.get('collectCount'),
                    drama.get('chapterCount'),
                    drama.get('sourceUrl'),
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ))
                imported += 1
            
            # Handle tags
            tags = drama.get('tags', [])
            for tag_name in tags:
                if not tag_name:
                    continue
                
                tag_slug = generate_slug(tag_name)
                
                # Create or get tag
                cursor.execute("SELECT id FROM Tag WHERE slug = ?", (tag_slug,))
                tag_row = cursor.fetchone()
                
                if tag_row:
                    tag_id = tag_row['id']
                else:
                    import uuid
                    tag_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO Tag (id, name, slug, category, dramaCount, createdAt, updatedAt)
                        VALUES (?, ?, ?, 'genre', 0, ?, ?)
                    """, (tag_id, tag_name, tag_slug, datetime.now().isoformat(), datetime.now().isoformat()))
                
                # Link drama to tag
                cursor.execute("""
                    INSERT OR IGNORE INTO DramaTag (id, dramaId, tagId, priority)
                    VALUES (?, ?, ?, 0)
                """, (str(uuid.uuid4()), drama_id, tag_id))
            
            conn.commit()
            
        except Exception as e:
            print(f"  ❌ Error importing '{drama.get('title', 'unknown')}': {e}")
            conn.rollback()
    
    # Update tag counts
    cursor.execute("""
        UPDATE Tag SET dramaCount = (
            SELECT COUNT(*) FROM DramaTag WHERE tagId = Tag.id
        )
    """)
    conn.commit()
    
    conn.close()
    return imported


def get_stats() -> Dict:
    """Get database statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM Drama")
    drama_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM Tag")
    tag_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM Platform")
    platform_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'dramas': drama_count,
        'tags': tag_count,
        'platforms': platform_count,
    }


if __name__ == "__main__":
    stats = get_stats()
    print(f"📊 Database stats: {stats}")
