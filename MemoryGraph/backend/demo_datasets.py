"""
Ultra-rich demo datasets for hackathon judges.
Each dataset tells a story and shows relationship extraction power.
"""

DEMO_DATASETS = {
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
    }
}

# Quick reference for frontend demo mode
DEMO_SHOWCASE = {
    "showcase_graphs": [
        {"key": "student_notes", "emoji": "🎓", "title": "Student's Academic Journey", "nodes": 15, "relationships": 14},
        {"key": "researcher_notes", "emoji": "🔬", "title": "Medical Research Timeline", "nodes": 12, "relationships": 11},
        {"key": "life_timeline", "emoji": "❤️", "title": "15-Year Life Journey", "nodes": 18, "relationships": 17},
    ]
}
