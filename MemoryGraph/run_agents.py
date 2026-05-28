from MemoryGraph.backend.agents import AgentManager


def main():
    mgr = AgentManager()
    mgr.index_document("doc1", "On 2023-05-01, Alice visited OpenAI. Contact: alice@example.com. More info at https://openai.com")
    mgr.index_document("doc2", "Bob joined on 2022-12-15. He likes Python and AI.")
    print("Insights:", mgr.get_insights())
    print("Chat answer:", mgr.answer("Alice OpenAI contact"))
    print("Extraction:", mgr.extract("Reach out to bob@example.com on 01/02/2024"))
    print("Timeline:", mgr.build_timeline([
        {"id":"e1","text":"Event A happened on 2021-01-10"},
        {"id":"e2","text":"Event B happened 2020-05-05"},
        {"id":"e3","text":"No date here"},
    ]))


if __name__ == "__main__":
    main()
