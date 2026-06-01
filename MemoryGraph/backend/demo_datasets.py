# Updated by GitHub contribution automation.
"""
Ultra-rich demo datasets for hackathon judges.
Each dataset tells a story and shows relationship extraction power.
"""

DEMO_DATASETS = {
    "family_archive_flagship": {
        "title": "Patel Family Archive — Grandfather to Today",
        "description": "Rich multi-generation family memories for graph, Time Machine, and Memory Proof demos",
        "memories": [
            {
                "id": "fam_1",
                "title": "Grandfather's Mumbai Childhood",
                "summary": "Grandfather grew up in Dadar, Mumbai, listening to stories from his own father.",
                "raw_text": "Grandfather told us he grew up in Dadar, Mumbai in the 1950s. His father worked at the docks and every evening the family gathered on the terrace to share stories about village life before the move to the city.",
                "structured_data": {
                    "people": ["Grandfather", "Great-grandfather", "Grandmother"],
                    "places": ["Dadar", "Mumbai", "Dockside Quarter"],
                    "events": ["Childhood", "Family stories"],
                    "dates": ["1954"],
                    "summary": "Grandfather's childhood in Mumbai with dockside family stories.",
                },
            },
            {
                "id": "fam_2",
                "title": "Grandfather's First Job at the Port",
                "summary": "Grandfather started work at Mumbai port and sent money home to his parents.",
                "raw_text": "At eighteen, grandfather took his first job at the Mumbai port office. He walked Marine Drive every Sunday and mailed part of his salary to his parents in Dadar.",
                "structured_data": {
                    "people": ["Grandfather", "Great-grandfather"],
                    "places": ["Mumbai", "Marine Drive", "Port Office"],
                    "events": ["First job", "Sunday walks"],
                    "dates": ["1962"],
                    "summary": "Grandfather began working at the port and supported his parents.",
                },
            },
            {
                "id": "fam_3",
                "title": "Father's Birth and Naming Ceremony",
                "summary": "Father was born in Mumbai; grandfather chose his name during a monsoon-season ceremony.",
                "raw_text": "Father was born in Mumbai during the monsoon of 1978. Grandfather held a small naming ceremony at home with neighbors from Dadar and gifts of sweets from Marine Drive market vendors.",
                "structured_data": {
                    "people": ["Father", "Grandfather", "Grandmother", "Mother"],
                    "places": ["Mumbai", "Dadar"],
                    "events": ["Birth", "Naming ceremony"],
                    "dates": ["1978"],
                    "summary": "Father born in Mumbai; family naming ceremony with neighbors.",
                },
            },
            {
                "id": "fam_4",
                "title": "Summer at Grandfather's Terrace",
                "summary": "Father spent summers on grandfather's terrace learning cricket and family history.",
                "raw_text": "Every summer, father visited grandfather's terrace in Mumbai. They played cricket until sunset and grandfather explained how the family moved from the village to the city after the war.",
                "structured_data": {
                    "people": ["Father", "Grandfather"],
                    "places": ["Mumbai", "Dadar Terrace"],
                    "events": ["Summer visits", "Cricket", "Family history"],
                    "dates": ["1988", "1989"],
                    "summary": "Father's summers with grandfather on the Mumbai terrace.",
                },
            },
            {
                "id": "fam_5",
                "title": "Father's Engineering College in Pune",
                "summary": "Father moved to Pune for engineering and met lifelong friends Amit and Rahul.",
                "raw_text": "Father moved to Pune in 1998 for engineering college. He met Amit and Rahul in the hostel, and they spent late nights building small electronics projects while calling grandfather every weekend.",
                "structured_data": {
                    "people": ["Father", "Grandfather", "Amit", "Rahul"],
                    "places": ["Pune", "Engineering College Hostel"],
                    "events": ["College admission", "Hostel life"],
                    "dates": ["1998"],
                    "summary": "Father began engineering in Pune and formed close friendships.",
                },
            },
            {
                "id": "fam_6",
                "title": "Father's First Internship in Mumbai",
                "summary": "Father interned in Mumbai at age twenty-two and walked Marine Drive with grandfather.",
                "raw_text": "In 2000, father completed his first internship at a manufacturing company in Mumbai. Mr. Mehta was his manager. Grandfather met him at Marine Drive every Sunday to talk about discipline and the future.",
                "structured_data": {
                    "people": ["Father", "Grandfather", "Mr. Mehta"],
                    "places": ["Mumbai", "Marine Drive"],
                    "events": ["Internship", "Sunday walks"],
                    "dates": ["2000"],
                    "summary": "Father's Mumbai internship shaped his work ethic with grandfather's guidance.",
                },
            },
            {
                "id": "fam_7",
                "title": "Father's Graduation Trip with Grandfather",
                "summary": "Father graduated in 2002; grandfather traveled to Bangalore for the ceremony.",
                "raw_text": "Father graduated in 2002 and accepted his first job in Bangalore. Grandfather took the train to attend the ceremony and gave father his first wristwatch near Indiranagar.",
                "structured_data": {
                    "people": ["Father", "Grandfather", "Grandmother"],
                    "places": ["Bangalore", "Indiranagar", "Pune"],
                    "events": ["Graduation", "First job"],
                    "dates": ["2002"],
                    "summary": "Father graduated and moved to Bangalore; grandfather attended.",
                },
            },
            {
                "id": "fam_8",
                "title": "Parents Met at Neha's Wedding in Delhi",
                "summary": "Father met mother at cousin Neha's wedding; grandfather approved immediately.",
                "raw_text": "In 2005, father met mother at cousin Neha's wedding in Delhi. Grandfather said he recognized mother's family from an old Mumbai connection and blessed the match after one long conversation.",
                "structured_data": {
                    "people": ["Father", "Mother", "Grandfather", "Neha"],
                    "places": ["Delhi", "Wedding Hall"],
                    "events": ["Family wedding", "First meeting"],
                    "dates": ["2005"],
                    "summary": "Father met mother at Neha's wedding with grandfather's blessing.",
                },
            },
            {
                "id": "fam_9",
                "title": "Father and Amit Launch a Business",
                "summary": "Father left corporate work and started a small business with Amit in Bangalore.",
                "raw_text": "By 2008, father left his corporate job and started a small business with Amit in Bangalore. Grandfather visited the tiny first office and said it reminded him of his own first job at the port.",
                "structured_data": {
                    "people": ["Father", "Amit", "Grandfather", "Mother"],
                    "places": ["Bangalore", "First Office"],
                    "events": ["Business launch", "Career change"],
                    "dates": ["2008"],
                    "summary": "Father launched a business with Amit; grandfather visited the office.",
                },
            },
            {
                "id": "fam_10",
                "title": "Grandfather's 70th Birthday Reunion",
                "summary": "Full family reunion in Mumbai for grandfather's birthday with photos and letters.",
                "raw_text": "We gathered in Mumbai for grandfather's 70th birthday. Father organized the reunion, mother cooked family recipes, and we scanned old letters from Dadar into the archive that night.",
                "structured_data": {
                    "people": ["Grandfather", "Father", "Mother", "Amit", "Family"],
                    "places": ["Mumbai", "Dadar"],
                    "events": ["Birthday reunion", "Letter scanning"],
                    "dates": ["2016"],
                    "summary": "Family reunion in Mumbai celebrating grandfather's 70th birthday.",
                },
            },
            {
                "id": "fam_11",
                "title": "Our Trip to Marine Drive",
                "summary": "Three generations walked Marine Drive and recorded grandfather's port stories.",
                "raw_text": "Father, grandfather, and I walked Marine Drive at sunset. Grandfather pointed to the port lights and retold how he mailed his first salary home. We recorded his voice for the family archive.",
                "structured_data": {
                    "people": ["Grandfather", "Father", "Me"],
                    "places": ["Marine Drive", "Mumbai"],
                    "events": ["Family walk", "Oral history recording"],
                    "dates": ["2019"],
                    "summary": "Three-generation walk at Marine Drive with recorded stories.",
                },
            },
            {
                "id": "fam_12",
                "title": "Grandfather's Advice Letter to Father",
                "summary": "Grandfather wrote father a letter about patience before a difficult business year.",
                "raw_text": "Grandfather wrote father a handwritten letter during a difficult business year. He reminded father of the 2000 internship, the 2008 launch, and the importance of keeping family stories alive for the next generation.",
                "structured_data": {
                    "people": ["Grandfather", "Father"],
                    "places": ["Mumbai", "Bangalore"],
                    "events": ["Letter", "Business advice"],
                    "dates": ["2021"],
                    "summary": "Grandfather's letter connecting past milestones to present challenges.",
                },
            },
            {
                "id": "fam_13",
                "title": "Wedding Album Digitized",
                "summary": "Mother and father digitized wedding photos with grandfather's captions.",
                "raw_text": "Mother and father digitized their wedding album. Grandfather labeled each photo with names, years, and places — Delhi, Mumbai, and the mountain resort where the ceremony was held.",
                "structured_data": {
                    "people": ["Father", "Mother", "Grandfather", "Sarah"],
                    "places": ["Delhi", "Mountain Resort", "Mumbai"],
                    "events": ["Wedding", "Photo digitization"],
                    "dates": ["2020"],
                    "summary": "Wedding photos digitized with grandfather's captions.",
                },
            },
            {
                "id": "fam_14",
                "title": "Father Teaches Me the Family Tree",
                "summary": "Father explained the family tree using old photos from grandfather's trunk.",
                "raw_text": "Father opened grandfather's trunk of photos and explained our family tree — from great-grandfather at the docks to mother's family in Delhi and our cousins across Pune and Bangalore.",
                "structured_data": {
                    "people": ["Father", "Grandfather", "Mother", "Me"],
                    "places": ["Mumbai", "Home Archive"],
                    "events": ["Family tree lesson"],
                    "dates": ["2023"],
                    "summary": "Father taught the family tree using grandfather's photo trunk.",
                },
            },
            {
                "id": "fam_15",
                "title": "Grandfather's Hospital Visit — Stories Preserved",
                "summary": "Family recorded grandfather's stories during recovery; father led the archive project.",
                "raw_text": "During grandfather's recovery, father brought a recorder to the hospital. Grandfather retold Mumbai childhood stories, father's Pune college years, and asked us to keep the archive updated for grandchildren.",
                "structured_data": {
                    "people": ["Grandfather", "Father", "Mother", "Me"],
                    "places": ["Mumbai Hospital", "Dadar"],
                    "events": ["Story preservation", "Recovery"],
                    "dates": ["2024"],
                    "summary": "Recorded grandfather's stories during recovery for the archive.",
                },
            },
        ],
        "relationships": [
            ("Grandfather", "raised_in", "Mumbai"),
            ("Grandfather", "worked_at", "Port Office"),
            ("Grandfather", "father_of", "Father"),
            ("Grandmother", "married_to", "Grandfather"),
            ("Father", "son_of", "Grandfather"),
            ("Mother", "married_to", "Father"),
            ("Father", "studied_in", "Pune"),
            ("Father", "interned_in", "Mumbai"),
            ("Father", "worked_in", "Bangalore"),
            ("Amit", "cofounded_with", "Father"),
            ("Neha", "cousin_of", "Father"),
            ("Marine Drive", "connected_to", "Grandfather"),
            ("Marine Drive", "connected_to", "Father"),
            ("Dadar", "childhood_home_of", "Grandfather"),
            ("Pune", "college_city_of", "Father"),
            ("Bangalore", "business_city_of", "Father"),
            ("Delhi", "wedding_city_of", "Parents"),
            ("Grandfather", "mentored", "Father"),
            ("Father", "mentors", "Me"),
            ("Family Archive", "preserves", "Grandfather"),
            ("Family Archive", "preserves", "Father"),
            ("1954", "era_of", "Grandfather Childhood"),
            ("1998", "era_of", "Father College"),
            ("2008", "era_of", "Father Business"),
            ("2016", "era_of", "Family Reunion"),
        ],
    },
    "student_notes": {
        "title": "College Student's Academic Journey",
        "description": "Notes, assignments, and research from computer science program",
        "memories": [
            {
                "id": "mem_1",
                "title": "CS101 Introduction to Programming",
                "summary": "Learned Python fundamentals with Prof. Sarah Chen. Built calculator app with John and Maria.",
                "raw_text": "Today in CS101, Professor Sarah Chen taught us Python loops and functions. John and I worked on the calculator project together. Maria from the study group helped debug our code. The project is due next Friday.",
                "structured_data": {
                    "people": ["Sarah Chen (Professor)", "John Smith (Classmate)", "Maria Garcia (Study Group)"],
                    "places": ["CS Building Room 301", "Library Lab"],
                    "events": ["CS101 Lecture", "Calculator Project"],
                    "dates": ["2024-09-15"],
                    "summary": "Started CS101 with Prof Chen, worked on Python fundamentals"
                }
            },
            {
                "id": "mem_2",
                "title": "Data Structures with Prof. Chen",
                "summary": "Advanced algorithms course taught by Sarah Chen. Collaborated with John on tree implementations.",
                "raw_text": "Prof. Sarah Chen's Data Structures course is challenging but amazing. John and I are partners for the BST project. We're studying at the library with Maria and other group members. This builds on CS101 fundamentals.",
                "structured_data": {
                    "people": ["Sarah Chen (Professor)", "John Smith (Project Partner)", "Maria Garcia (Study Group)", "Alex Kumar (Classmate)"],
                    "places": ["CS Building", "Library Lab", "Coffee Shop"],
                    "events": ["Data Structures Course", "BST Project", "Study Session"],
                    "dates": ["2024-11-10"],
                    "summary": "Taking advanced Data Structures with Prof Chen and team"
                }
            },
            {
                "id": "mem_3",
                "title": "Hackathon Victory - Team Formation",
                "summary": "Won hackathon competition with John, Maria, and Alex. Built memory graph app.",
                "raw_text": "John convinced me to join the hackathon team with Maria and Alex. Sarah Chen was our faculty advisor. We built MemoryGraph in 48 hours. The project combines what we learned in her classes - graph algorithms, Python, and user experience design.",
                "structured_data": {
                    "people": ["John Smith (Teammate)", "Maria Garcia (Teammate)", "Alex Kumar (Teammate)", "Sarah Chen (Advisor)"],
                    "places": ["Hackathon Venue", "Innovation Lab"],
                    "events": ["Hackathon Competition", "Team Formation", "Project Demo"],
                    "dates": ["2024-12-01"],
                    "summary": "Won hackathon with team on memory graph project"
                }
            },
            {
                "id": "mem_4",
                "title": "Internship at TechCorp with John's Referral",
                "summary": "Got internship through John's referral at TechCorp. Working with Maria's brother on backend systems.",
                "raw_text": "John referred me for a backend engineering internship at TechCorp. My manager is David Garcia (Maria's brother). I'm building microservices and learning from the team. The hackathon project impressed them!",
                "structured_data": {
                    "people": ["John Smith (Referrer)", "David Garcia (Manager)", "Maria Garcia (Connection)"],
                    "places": ["TechCorp HQ", "San Francisco"],
                    "events": ["Internship Start", "Microservices Project"],
                    "dates": ["2025-01-15"],
                    "summary": "Started backend engineering internship at TechCorp"
                }
            },
            {
                "id": "mem_5",
                "title": "Research Paper on Graph Algorithms",
                "summary": "Writing paper with Prof. Chen on memory graph optimization. Publishing in ACM.",
                "raw_text": "Prof. Sarah Chen invited me to co-author a research paper on efficient graph traversal algorithms. The paper is based on optimizations we did for the hackathon project. Alex is also a co-author. Submitting to ACM Conference.",
                "structured_data": {
                    "people": ["Sarah Chen (Advisor)", "Alex Kumar (Co-author)"],
                    "places": ["University Research Lab"],
                    "events": ["Research Project", "Paper Submission"],
                    "dates": ["2025-03-01"],
                    "summary": "Co-authoring research paper on graph algorithms with Prof Chen"
                }
            }
        ],
        "relationships": [
            ("Sarah Chen", "teaches", "CS101"),
            ("Sarah Chen", "teaches", "Data Structures"),
            ("Sarah Chen", "advises", "Hackathon"),
            ("John Smith", "teammate_in", "Hackathon"),
            ("Maria Garcia", "teammate_in", "Hackathon"),
            ("Alex Kumar", "teammate_in", "Hackathon"),
            ("John Smith", "referred_to", "TechCorp"),
            ("David Garcia", "manager_of", "Internship"),
            ("Maria Garcia", "sibling_of", "David Garcia"),
            ("Alex Kumar", "co_author_with", "Research Paper"),
            ("CS101", "foundation_for", "Data Structures"),
            ("Data Structures", "foundation_for", "Hackathon"),
            ("Hackathon", "led_to", "TechCorp Internship"),
            ("Hackathon", "led_to", "Research Paper"),
        ]
    },
    
    "researcher_notes": {
        "title": "Medical Research Project Timeline",
        "description": "Researcher tracking studies, collaborations, and breakthrough discoveries",
        "memories": [
            {
                "id": "res_1",
                "title": "Initial Literature Review - Cancer Immunotherapy",
                "summary": "Started researching checkpoint inhibitors with literature review led by Dr. James Wong",
                "raw_text": "Dr. James Wong assigned me a literature review on PD-1 checkpoint inhibitors. Key papers from researchers like Tasuku Honjo and James Allison. Meeting with the team at Hopkins Medical Center to discuss findings.",
                "structured_data": {
                    "people": ["Dr. James Wong (PI)", "Tasuku Honjo (Researcher)", "James Allison (Researcher)"],
                    "places": ["Johns Hopkins Medical Center", "Lab Room 302"],
                    "events": ["Literature Review", "Team Meeting"],
                    "dates": ["2024-06-01"],
                    "summary": "Literature review on cancer immunotherapy"
                }
            },
            {
                "id": "res_2",
                "title": "Collaboration with Dr. Wong's Lab",
                "summary": "Joined Dr. Wong's lab. Working with Dr. Chen on bench experiments.",
                "raw_text": "Joined Dr. James Wong's immunotherapy lab at Hopkins. Dr. Lisa Chen leads the bench work. We're testing new combinations of checkpoint inhibitors on cell cultures. Initial results look promising!",
                "structured_data": {
                    "people": ["Dr. James Wong (Lab Director)", "Dr. Lisa Chen (Bench Lead)"],
                    "places": ["Hopkins Immunotherapy Lab", "Cell Culture Suite"],
                    "events": ["Lab Joining", "Experiments Begin"],
                    "dates": ["2024-07-15"],
                    "summary": "Joined Wong lab, started bench experiments with Dr Chen"
                }
            },
            {
                "id": "res_3",
                "title": "Conference Presentation - ASCO Annual Meeting",
                "summary": "Presented preliminary findings at ASCO conference with Dr. Wong and team",
                "raw_text": "Presented our preliminary immunotherapy data at ASCO. Dr. James Wong was presenting author. Dr. Lisa Chen and I presented the bench work results. Got great feedback from Tasuku Honjo who was in the audience!",
                "structured_data": {
                    "people": ["Dr. James Wong", "Dr. Lisa Chen", "Tasuku Honjo"],
                    "places": ["ASCO Annual Meeting", "Chicago Convention Center"],
                    "events": ["Conference Presentation", "Networking"],
                    "dates": ["2024-10-20"],
                    "summary": "Presented research at ASCO conference"
                }
            },
            {
                "id": "res_4",
                "title": "Breakthrough - Treatment Efficacy Discovery",
                "summary": "Discovered synergistic effect between PD-1 and LAG-3 inhibitors",
                "raw_text": "Major breakthrough! Our combination therapy shows 3x efficacy compared to single agent. Dr. Lisa Chen confirmed the results. Dr. Wong is excited - this could be publishable! Need to run more replicates with Dr. Chen's guidance.",
                "structured_data": {
                    "people": ["Dr. James Wong", "Dr. Lisa Chen"],
                    "places": ["Lab Room 302", "Hopkins Research Building"],
                    "events": ["Breakthrough Discovery", "Data Validation"],
                    "dates": ["2024-11-30"],
                    "summary": "Discovered synergistic treatment combination"
                }
            },
            {
                "id": "res_5",
                "title": "First Author Publication Submitted",
                "summary": "First author paper submitted to Nature Medicine with Dr. Wong and team",
                "raw_text": "Submitted first-author paper to Nature Medicine! Dr. James Wong is senior author. Dr. Lisa Chen, Tasuku Honjo, and James Allison are co-authors. The breakthrough combination therapy paper. Could be huge for the field!",
                "structured_data": {
                    "people": ["Dr. James Wong (Senior Author)", "Dr. Lisa Chen (Co-author)", "Tasuku Honjo (Co-author)", "James Allison (Co-author)"],
                    "places": ["Nature Medicine Journal"],
                    "events": ["Paper Submission", "Peer Review"],
                    "dates": ["2025-02-15"],
                    "summary": "Submitted first-author paper to Nature Medicine"
                }
            }
        ],
        "relationships": [
            ("Dr. James Wong", "leads", "Immunotherapy Lab"),
            ("Dr. Lisa Chen", "works_in", "Wong Lab"),
            ("Tasuku Honjo", "authored", "PD-1 Research"),
            ("James Allison", "authored", "Checkpoint Inhibitor Research"),
            ("PD-1 Inhibitors", "combines_with", "LAG-3 Inhibitors"),
            ("Combination Therapy", "published_in", "Nature Medicine"),
            ("Dr. Wong", "mentors", "Research Team"),
            ("Hopkins Medical Center", "hosts", "Immunotherapy Lab"),
        ]
    },

    "life_timeline": {
        "title": "15-Year Life Journey Map",
        "description": "Major life events, relationships, and how they connect",
        "memories": [
            {
                "id": "life_1",
                "title": "Met Sarah at College",
                "summary": "First day of college. Met Sarah in dorm orientation.",
                "raw_text": "First day at State University. During orientation, I met Sarah in the dorm lounge. We became instant friends. She was assigned to the room next to mine. Little did we know this would change our lives.",
                "structured_data": {
                    "people": ["Sarah (Best Friend)"],
                    "places": ["State University", "Dorm Hall A"],
                    "events": ["College Orientation", "First Meeting"],
                    "dates": ["2010-09-01"],
                    "summary": "Met Sarah during college orientation"
                }
            },
            {
                "id": "life_2",
                "title": "Graduated with Sarah",
                "summary": "Completed degree with Sarah. Started jobs in different cities.",
                "raw_text": "Sarah and I both graduated! We threw a huge party with our college friends. She got a job offer in NYC, I got one in San Francisco. We promised to stay in touch despite the distance.",
                "structured_data": {
                    "people": ["Sarah (Best Friend)"],
                    "places": ["State University", "NYC", "San Francisco"],
                    "events": ["Graduation", "Job Offers"],
                    "dates": ["2014-05-15"],
                    "summary": "Graduated and started jobs in different cities"
                }
            },
            {
                "id": "life_3",
                "title": "Met Daniel - Sarah's Introduction",
                "summary": "Sarah introduced me to Daniel at an event. We started dating.",
                "raw_text": "Sarah was visiting SF from NYC and brought her boyfriend Daniel to a dinner. They thought we'd get along since we're both into hiking and travel. Turns out she was right! Daniel and I have been inseparable since.",
                "structured_data": {
                    "people": ["Sarah (Best Friend)", "Daniel (Partner)", "Daniel's Family"],
                    "places": ["San Francisco", "Hiking Trails"],
                    "events": ["Meeting", "First Date"],
                    "dates": ["2015-07-20"],
                    "summary": "Met Daniel through Sarah, started dating"
                }
            },
            {
                "id": "life_4",
                "title": "Got Engaged in Moab",
                "summary": "Daniel proposed during hiking trip. Sarah was there as witness.",
                "raw_text": "Daniel took me hiking in Moab. At sunset on top of the rock formation, he proposed! Sarah was there hiking with us (and knew about the plan). Happiest moment of my life. Can't wait to marry Daniel!",
                "structured_data": {
                    "people": ["Daniel (Fiancé)", "Sarah (Witness & Best Friend)"],
                    "places": ["Moab", "Arches National Park"],
                    "events": ["Engagement", "Proposal"],
                    "dates": ["2018-10-15"],
                    "summary": "Got engaged to Daniel in Moab"
                }
            },
            {
                "id": "life_5",
                "title": "Wedding Day",
                "summary": "Married Daniel. Sarah was maid of honor.",
                "raw_text": "Best day ever! Married Daniel surrounded by family and friends. Sarah was my maid of honor. My parents cried happy tears. Daniel's family flew in from Portland. Perfect day in the mountains.",
                "structured_data": {
                    "people": ["Daniel (Spouse)", "Sarah (Maid of Honor)", "Parents", "Daniel's Family"],
                    "places": ["Mountain Resort", "Ceremony Location"],
                    "events": ["Wedding", "Celebration"],
                    "dates": ["2020-06-20"],
                    "summary": "Married Daniel in mountain ceremony"
                }
            },
            {
                "id": "life_6",
                "title": "New House Purchase",
                "summary": "Bought house with Daniel. Sarah helped decorate.",
                "raw_text": "Daniel and I finally saved enough for a down payment! Bought our dream house in Oakland. Sarah came for the housewarming party and helped us set up the living room. This is where we'll build our future together.",
                "structured_data": {
                    "people": ["Daniel (Co-owner)", "Sarah (Friend & Helper)"],
                    "places": ["Oakland", "New House"],
                    "events": ["House Purchase", "Housewarming"],
                    "dates": ["2021-03-10"],
                    "summary": "Bought house with Daniel in Oakland"
                }
            },
            {
                "id": "life_7",
                "title": "Started Family Planning",
                "summary": "Daniel and I discussing starting a family. Sarah giving advice.",
                "raw_text": "Dinner with Sarah - she's asking when we're having kids! Daniel and I have been talking about this. We want to have our first baby next year. Sarah's excited to be an aunt. Life is perfect right now.",
                "structured_data": {
                    "people": ["Daniel", "Sarah", "Future Baby"],
                    "places": ["Oakland Home"],
                    "events": ["Family Planning", "Life Discussion"],
                    "dates": ["2022-09-15"],
                    "summary": "Planning to start family with Daniel"
                }
            }
        ],
        "relationships": [
            ("Sarah", "best_friend_of", "Me"),
            ("Daniel", "married_to", "Me"),
            ("Sarah", "introduced", "Daniel"),
            ("College", "started", "Sarah & Me friendship"),
            ("Moab Trip", "led_to", "Engagement"),
            ("Wedding", "united", "Family"),
            ("House", "home_for", "Me & Daniel"),
            ("Sarah", "will_be_aunt_of", "Future Children"),
        ]
    },

    "father_time_machine": {
        "title": "Father's Early Adult Life Reconstruction",
        "description": "Memories designed to demonstrate age-based Time Machine queries",
        "memories": [
            {
                "id": "father_1",
                "title": "Father's Engineering College Admission",
                "summary": "Father moved to Pune for engineering college and met lifelong friends.",
                "raw_text": "My father moved to Pune in 1998 for engineering college. He met Amit and Rahul in the hostel, and they spent late nights building small electronics projects.",
                "structured_data": {
                    "people": ["Father", "Amit", "Rahul"],
                    "places": ["Pune", "Engineering College Hostel"],
                    "events": ["College Admission", "Hostel Life", "Electronics Projects"],
                    "dates": ["1998"],
                    "summary": "Father began engineering college in Pune and formed close friendships."
                }
            },
            {
                "id": "father_2",
                "title": "Father's First Internship",
                "summary": "Father completed his first internship in Mumbai during college.",
                "raw_text": "In 2000, father went to Mumbai for his first internship at a manufacturing company. He learned discipline from his manager Mr. Mehta and visited Marine Drive every Sunday.",
                "structured_data": {
                    "people": ["Father", "Mr. Mehta"],
                    "places": ["Mumbai", "Marine Drive"],
                    "events": ["First Internship", "Sunday Walks"],
                    "dates": ["2000"],
                    "summary": "Father's first Mumbai internship shaped his work ethic."
                }
            },
            {
                "id": "father_3",
                "title": "Father's Graduation And First Job",
                "summary": "Father graduated and started his first job in Bangalore.",
                "raw_text": "Father graduated in 2002 and accepted his first job in Bangalore. He rented a small room near Indiranagar and called grandmother every night.",
                "structured_data": {
                    "people": ["Father", "Grandmother"],
                    "places": ["Bangalore", "Indiranagar"],
                    "events": ["Graduation", "First Job"],
                    "dates": ["2002"],
                    "summary": "Father graduated and moved to Bangalore for his first job."
                }
            },
            {
                "id": "father_4",
                "title": "Parents Met At Family Wedding",
                "summary": "Father met mother at a family wedding in Delhi.",
                "raw_text": "In 2005, father met mother at cousin Neha's wedding in Delhi. They talked about books, music, and their dreams for the future.",
                "structured_data": {
                    "people": ["Father", "Mother", "Neha"],
                    "places": ["Delhi"],
                    "events": ["Family Wedding", "First Meeting"],
                    "dates": ["2005"],
                    "summary": "Father met mother at Neha's wedding in Delhi."
                }
            },
            {
                "id": "father_5",
                "title": "Father Started His Own Business",
                "summary": "Father left his job and started a small business with Amit.",
                "raw_text": "By 2008, father left his corporate job and started a small business with Amit. The first office was tiny, but he always said it felt like freedom.",
                "structured_data": {
                    "people": ["Father", "Amit"],
                    "places": ["Bangalore"],
                    "events": ["Business Launch", "Career Change"],
                    "dates": ["2008"],
                    "summary": "Father launched a small business with Amit in Bangalore."
                }
            }
        ],
        "relationships": [
            ("Father", "studied_in", "Pune"),
            ("Father", "interned_in", "Mumbai"),
            ("Father", "worked_in", "Bangalore"),
            ("Father", "met", "Mother"),
            ("Amit", "cofounded_with", "Father"),
            ("College", "led_to", "First Job"),
            ("First Job", "led_to", "Business Launch")
        ]
    }
}

# Quick reference for frontend demo mode
DEMO_SHOWCASE = {
    "showcase_graphs": [
        {"key": "family_archive_flagship", "emoji": "👨‍👩‍👧", "title": "Patel Family Archive", "nodes": 28, "relationships": 24},
        {"key": "father_time_machine", "emoji": "⏳", "title": "Father's Early Life", "nodes": 12, "relationships": 10},
        {"key": "student_notes", "emoji": "🎓", "title": "Student's Academic Journey", "nodes": 15, "relationships": 14},
    ]
}
