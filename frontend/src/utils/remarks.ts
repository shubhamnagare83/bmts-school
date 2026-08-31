export interface RemarkItem {
  id: string;
  en: string;
  mr: string;
}

export const REMARKS_BANK: { [category: string]: RemarkItem[] } = {
  PHYSICAL_MOTOR: [
    { id: 'pm1', en: 'Demonstrates excellent fine motor coordination in writing and drawing.', mr: 'लेखन आणि चित्रकलेत उत्तम सुक्ष्म स्नायू समन्वय दाखवतो/दाखवते.' },
    { id: 'pm2', en: 'Active participation in physical games and outdoor sports.', mr: 'मैदानी खेळ आणि शारीरिक उपक्रमांमध्ये उत्साही सहभाग.' },
    { id: 'pm3', en: 'Good posture and balance during physical exercises.', mr: 'शारीरिक व्यायामादरम्यान योग्य बसण्याची पद्धत व समतोल.' },
    { id: 'pm4', en: 'Shows agility and enthusiasm in group physical activities.', mr: 'गट उपक्रमांमध्ये चपळता आणि उत्साह दाखवतो/दाखवते.' },
    { id: 'pm5', en: 'Neat hand-eye coordination during craft and paper folding.', mr: 'हस्तकला व कागदाच्या घड्या घालताना छान डोळे-हात समन्वय.' },
    { id: 'pm6', en: 'Needs encouragement for gross motor physical exercises.', mr: 'मोठ्या स्नायूंच्या व्यायामासाठी अधिक प्रोत्साहनाची गरज आहे.' },
    { id: 'pm7', en: 'Exhibits good stamina and speed in physical activities.', mr: 'शारीरिक हालचालींमध्ये उत्तम शारीरिक क्षमता आणि वेग.' },
    { id: 'pm8', en: 'Maintains personal hygiene and cleanliness habits.', mr: 'वैयक्तिक स्वच्छता आणि टापटीपपणाच्या सवयी पाळतो/पाळते.' },
    { id: 'pm9', en: 'Good pencil grip and control while writing.', mr: 'लेखन करताना पेन्सिलवर योग्य पकड आणि नियंत्रण.' },
    { id: 'pm10', en: 'Enjoys rhythm, dance, and movement activities.', mr: 'तालबद्ध हालचाली आणि नृत्यामध्ये आनंद घेतो/घेते.' },
  ],
  SOCIAL_EMOTIONAL: [
    { id: 'se1', en: 'Cooperative with peers and shares classroom materials willingly.', mr: 'मित्रांशी सहकार्याची भावना व शैक्षणिक साहित्याची देवाणघेवाण करतो/करते.' },
    { id: 'se2', en: 'Shows empathy, respect, and politeness towards teachers and staff.', mr: 'शिक्षक व सहकाऱ्यांशी आदराने आणि नम्रतेने वागतो/वागते.' },
    { id: 'se3', en: 'Displays confidence in expressing thoughts and feelings.', mr: 'आपले विचार आणि भावना व्यक्त करताना आत्मविश्वास दाखवतो/दाखवते.' },
    { id: 'se4', en: 'Adapts smoothly to new classroom routines and rules.', mr: 'वर्गातील नवीन नियम व दिनचर्येचे सहज पालन करतो/करते.' },
    { id: 'se5', en: 'Takes responsibility for assigned classroom tasks.', mr: 'सोपवलेली जबाबदारी प्रामाणिकपणे पूर्ण करतो/करते.' },
    { id: 'se6', en: 'Demonstrates self-regulation and emotional stability.', mr: 'भावनांवर योग्य नियंत्रण व अभ्यासात संयम दाखवतो/दाखवते.' },
    { id: 'se7', en: 'Actively participates in group discussions and team events.', mr: 'गट चर्चा व सांस्कृतिक कार्यक्रमांमध्ये पुढाकार घेतो/घेते.' },
    { id: 'se8', en: 'Helpful and friendly nature towards classmates.', mr: 'मित्रांना मदत करण्याची वृत्ती व मैत्रीपूर्ण स्वभाव.' },
    { id: 'se9', en: 'Accepts constructive feedback with a positive attitude.', mr: 'सकारात्मक दृष्टिकोनाने मार्गदर्शन स्वीकारतो/स्वीकारते.' },
    { id: 'se10', en: 'Punctual and regular in daily attendance.', mr: 'दैनंदिन उपस्थितीत नियमितता व वेळेचे पालन.' },
  ],
  COGNITIVE: [
    { id: 'cd1', en: 'Strong logical reasoning and numerical problem-solving skills.', mr: 'तार्किक विचार आणि संख्यात्मक प्रश्न सोडवण्याचे उत्तम कौशल्य.' },
    { id: 'cd2', en: 'Quick understanding of mathematical patterns and concepts.', mr: 'गणितीय संकल्पना आणि आकृत्यांची जलद समज.' },
    { id: 'cd3', en: 'Curious and asks observant questions during lessons.', mr: 'अभ्यासादरम्यान उत्सुकतेने आणि अभ्यासू वृत्तीने प्रश्न विचारतो/विचारते.' },
    { id: 'cd4', en: 'Excellent memory retention and recall capability.', mr: 'स्मरणशक्ती आणि माहिती आठवण्याची उत्तम क्षमता.' },
    { id: 'cd5', en: 'Good analytical skills in environmental science activities.', mr: 'परिसर अभ्यासातील उपक्रमांमध्ये निरीक्षण आणि विश्लेषण क्षमता.' },
    { id: 'cd6', en: 'Follows multi-step instructions accurately.', mr: 'सूचनांचे तंतोतंत व अचूक पालन करतो/करते.' },
    { id: 'cd7', en: 'Independent problem solver with creative approach.', mr: 'सर्जनशील विचाराने स्वतःहून समस्या सोडवतो/सोडवते.' },
    { id: 'cd8', en: 'Demonstrates keen observation during science experiments.', mr: 'विज्ञान प्रयोगांदरम्यान सूक्ष्म निरीक्षण क्षमता.' },
    { id: 'cd9', en: 'Good spatial awareness and sorting abilities.', mr: 'वस्तूंचे वर्गीकरण व रचनेची योग्य समज.' },
    { id: 'cd10', en: 'Needs occasional guidance for complex problem solving.', mr: 'गुंतागुंतीच्या प्रश्नांसाठी काही वेळा मार्गदर्शनाची गरज असते.' },
  ],
  LANGUAGE_LITERACY: [
    { id: 'll1', en: 'Fluent reading with good comprehension and vocabulary.', mr: 'वाचनात ओघवतेपणा, शब्दसंग्रह आणि आकलनात उत्तम प्रगती.' },
    { id: 'll2', en: 'Expressive verbal communication in English, Marathi & Hindi.', mr: 'इंग्रजी, मराठी आणि हिंदी भाषेत प्रभावी संवाद कौशल्य.' },
    { id: 'll3', en: 'Clear pronunciation and confident recitation of poems.', mr: 'स्पष्ट उच्चार आणि कवितेचे आत्मविश्वासाने सादरीकरण.' },
    { id: 'll4', en: 'Neat, legible handwriting with proper spacing.', mr: 'सुवाच्य आणि टापटीप हस्तलेखन.' },
    { id: 'll5', en: 'Understands and responds accurately to stories.', mr: 'गोष्टींचे योग्य आकलन आणि उत्तरे देण्याची क्षमता.' },
    { id: 'll6', en: 'Good phonics awareness and spelling mastery.', mr: 'ध्वनीज्ञान (Phonics) आणि शब्दांचे अचूक उच्चार.' },
    { id: 'll7', en: 'Creative story writing and paragraph composition skills.', mr: 'सर्जनशील निबंध लेखन व कथा रचना कौशल्य.' },
    { id: 'll8', en: 'Attentive listener during classroom lectures.', mr: 'वर्गात लक्षपूर्वक ऐकणारा/ऐकणारी अभ्यासू विद्यार्थी.' },
    { id: 'll9', en: 'Encouraged to practice daily oral reading at home.', mr: 'घरी दररोज वाचनाचा सराव करण्याचा सल्ला दिला जातो.' },
    { id: 'll10', en: 'Uses rich vocabulary while forming sentences.', mr: 'वाक्यरचनेत समृद्ध शब्दसंग्रहाचा वापर करतो/करते.' },
  ],
  CREATIVE_AESTHETIC: [
    { id: 'ca1', en: 'Highly creative in drawing, coloring, and artistic design.', mr: 'चित्रकला, रंगकाम आणि कलात्मक निर्मितीत विशेष कौशल्य.' },
    { id: 'ca2', en: 'Enthusiastic participation in music, singing, and drama.', mr: 'संगीत, गायन आणि नाटकात उत्साही सहभाग.' },
    { id: 'ca3', en: 'Innovative thinking in craft projects and origami.', mr: 'हस्तकला व कागदी वस्तू बनवण्यात नावीन्यपूर्ण विचार.' },
    { id: 'ca4', en: 'Expressive imagination reflected in artwork.', mr: 'कलाकृतींमधून कल्पकता आणि भावनांचे सुंदर दर्शन.' },
    { id: 'ca5', en: 'Good sense of color combinations and patterns.', mr: 'रंगसंगती आणि नक्षीकामाची छान समज.' },
    { id: 'ca6', en: 'Enjoys rhythmic movement and musical beats.', mr: 'संगीताच्या तालावर उत्स्फूर्त प्रतिसाद देतो/देते.' },
    { id: 'ca7', en: 'Appreciates aesthetic beauty in nature and classroom art.', mr: 'निसर्ग व कलाकृतींमधील सौंदर्याचा आस्वाद घेतो/घेते.' },
    { id: 'ca8', en: 'Keen interest in cultural activities and celebrations.', mr: 'सांस्कृतिक कार्यक्रम व सणांच्या सादरीकरणात विशेष आवड.' },
    { id: 'ca9', en: 'Clean and tidy execution of art assignments.', mr: 'चित्रकलेचे काम अत्यंत टापटीपपणे पूर्ण करतो/करते.' },
    { id: 'ca10', en: 'Encouraged to explore more creative mediums.', mr: 'अधिक विविध कला प्रकार शिकण्यासाठी प्रोत्साहन दिले जाते.' },
  ],
  CHALLENGES: [
    { id: 'ch1', en: 'Needs practice to improve focus during complex tasks.', mr: 'गुंतागुंतीच्या कामांमध्ये एकाग्रता वाढवण्यासाठी सरावाची गरज.' },
    { id: 'ch2', en: 'Requires encouragement for public speaking and stage presentations.', mr: 'मंचावरील सादरीकरणासाठी अधिक प्रोत्साहनाची गरज.' },
    { id: 'ch3', en: 'Daily handwriting practice to maintain speed and neatness.', mr: 'लिखाणाचा वेग आणि सुवाच्यता टिकवण्यासाठी दररोज सरावाची गरज.' },
    { id: 'ch4', en: 'Enhancing mathematical problem-solving speed and accuracy.', mr: 'गणितातील प्रश्न सोडवण्याचा वेग आणि अचूकता वाढवणे.' },
    { id: 'ch5', en: 'Developing daily reading habit in English and regional languages.', mr: 'इंग्रजी व प्रादेशिक भाषांमधील दैनिक वाचनाची सवय विकसित करणे.' },
    { id: 'ch6', en: 'Building self-confidence while attempting new academic challenges.', mr: 'नवीन शैक्षणिक आव्हाने स्वीकारताना आत्मविश्वास वाढवणे.' },
    { id: 'ch7', en: 'Improving time management during written classroom assessments.', mr: 'लेखी परीक्षांमध्ये वेळेचे योग्य नियोजन शिकणे.' },
    { id: 'ch8', en: 'Encouraging active participation in group collaborative projects.', mr: 'गट उपक्रमांमध्ये अधिक सक्रिय सहभागासाठी प्रोत्साहन देणे.' },
    { id: 'ch9', en: 'Strengthening phonics and spelling accuracy in creative writing.', mr: 'लेखनात फोनिक्स आणि शब्दसंग्रह सुधारणे.' },
    { id: 'ch10', en: 'Regular practice of mental arithmetic and tables.', mr: 'पाढे आणि तोंडी गणिताचा नियमित सराव करणे.' },
  ],
  STRENGTHS: [
    { id: 'str1', en: 'High curiosity, analytical mindset, and academic dedication.', mr: 'जिज्ञासू वृत्ती, अभ्यासू दृष्टिकोन आणि अभ्यासात सातत्य.' },
    { id: 'str2', en: 'Natural leadership qualities and helpful behavior.', mr: 'नेतृत्व गुण आणि सहकाऱ्यांना मदत करण्याची वृत्ती.' },
    { id: 'str3', en: 'Exceptional artistic creativity and expressive communication.', mr: 'अफाट कलात्मक सर्जनशीलता आणि संवादातील गोडवा.' },
    { id: 'str4', en: 'Strong mathematical aptitude and quick problem solving.', mr: 'गणितातील गती आणि जलद आकलन क्षमता.' },
    { id: 'str5', en: 'Disciplined, respectful, and punctual conduct.', mr: 'शिस्तबद्ध, आदरातिथ्य आणि वेळेचे तंतोतंत पालन.' },
    { id: 'str6', en: 'Enthusiastic participation in sports and outdoor activities.', mr: 'खेळ आणि मैदानी उपक्रमांमधील उदंड उत्साह.' },
    { id: 'str7', en: 'Excellent multilingual vocabulary and reading skills.', mr: 'भाषिक समृद्धी आणि वाचनातील प्रगती.' },
    { id: 'str8', en: 'Quick learner with high memory retention power.', mr: 'जलद शिकण्याची व उत्तम स्मरणशक्ती.' },
    { id: 'str9', en: 'High emotional maturity and positive social attitude.', mr: 'भावनिक परिपक्वता आणि सकारात्मक सामाजिक दृष्टी.' },
    { id: 'str10', en: 'Neat and organized approach towards all school assignments.', mr: 'सर्व अभ्यासात कमालीचा टापटीपपणा आणि नियोजन.' },
  ],
  SUPPORT_NEEDED: [
    { id: 'sup1', en: 'Daily handwriting practice and letter spacing.', mr: 'दररोज हस्तलेखन आणि अक्षरांमधील अंतराचा सराव करणे.' },
    { id: 'sup2', en: 'Regular reading of English & Regional storybooks at home.', mr: 'घरी नियमित वाचनाचा सराव आवश्यक आहे.' },
    { id: 'sup3', en: 'Focus on basic mathematical table recitation and mental math.', mr: 'पाढे पाठांतर आणि तोंडी गणितावर भर देणे.' },
    { id: 'sup4', en: 'Encouragement for active participation in group speaking.', mr: 'गट चर्चेत बोलण्यासाठी अधिक प्रोत्साहन देणे.' },
    { id: 'sup5', en: 'Guidance in maintaining neatness in notebooks.', mr: 'वहीतील टापटीपपणा आणि लिखाणात सुधारणा.' },
    { id: 'sup6', en: 'Time management during written examinations.', mr: 'परीक्षेत वेळेचे नियोजन शिकण्याची गरज.' },
    { id: 'sup7', en: 'Sustained focus and attention during classroom lectures.', mr: 'अभ्यासातील एकाग्रता वाढवण्याचा प्रयत्न करणे.' },
    { id: 'sup8', en: 'Confidence building while presenting on stage.', mr: 'मंचावर सादरीकरण करताना आत्मविश्वास वाढवणे.' },
    { id: 'sup9', en: 'Parental supervision during evening study routines.', mr: 'संध्याकाळच्या अभ्यासाच्या वेळी पालकांचे मार्गदर्शन.' },
    { id: 'sup10', en: 'Encouraging independent completion of daily homework.', mr: 'स्वाध्यायाचे काम स्वतःहून पूर्ण करण्यास प्रोत्साहन देणे.' },
  ],
  SECONDARY_SPECIAL_PROGRESS: [
    { id: 'ssp1', en: 'Demonstrates strong conceptual understanding and analytical thinking in subjects.', mr: 'संकल्पनांचे उत्कृष्ट आकलन व विश्लेषणात्मक विचारक्षमता दर्शवितो/दर्शविते.' },
    { id: 'ssp2', en: 'Consistent academic performance with dedicated problem-solving skills.', mr: 'सातत्यपूर्ण शैक्षणिक कामगिरी व समस्या सोडविण्याचे उत्तम कौशल्य.' },
    { id: 'ssp3', en: 'Shows active participation in classroom discussions and scientific experiments.', mr: 'वर्गातील चर्चा व विज्ञान प्रयोगांमध्ये अत्यंत सक्रिय सहभाग.' },
    { id: 'ssp4', en: 'Excellent writing skills, clear expression, and neat presentation in tests.', mr: 'चांगले लेखन कौशल्य, विचार मांडणी आणि परीक्षांमध्ये टापटीप सादरीकरण.' },
    { id: 'ssp5', en: 'Independent learner with a proactive approach towards assignments and projects.', mr: 'स्वावलंबीपणे अभ्यास करणारा/करणारी व प्रकल्पांमध्ये पुढाकार घेणारा/घेणारी.' },
    { id: 'ssp6', en: 'Exhibits disciplined study habits, regular homework completion, and punctuality.', mr: 'शिस्तबद्ध अभ्यासाची सवय, नियमित स्वाध्याय पूर्ण करणे व वेळेचे पालन.' },
    { id: 'ssp7', en: 'Displays leadership qualities, team cooperation, and positive classroom conduct.', mr: 'उत्कृष्ट नेतृत्वगुण, सहकाऱ्यांशी सहकार्य आणि सकारात्मक वर्तन.' },
    { id: 'ssp8', en: 'Good multilingual communication and confident presentation abilities.', mr: 'चांगले बहुभाषिक संभाषण आणि आत्मविश्वासाने सादरीकरण करण्याची क्षमता.' },
  ],
  SECONDARY_IMPROVEMENT_NEEDED: [
    { id: 'sin1', en: 'Needs regular practice in mathematical calculations and numerical problem solving.', mr: 'गणितीय आकडेमोड व उदाहरणे सोडविण्याचा नियमित सराव आवश्यक आहे.' },
    { id: 'sin2', en: 'Requires consistent revision of scientific definitions, diagrams, and formulae.', mr: 'विज्ञानातील व्याख्या, आकृत्या व सूत्रांचे नियमित उजळणी करणे गरजेचे आहे.' },
    { id: 'sin3', en: 'Focus on improving writing speed and time management during examination.', mr: 'परीक्षेदरम्यान वेळेचे नियोजन आणि लेखनाचा वेग वाढविण्यावर भर द्यावा.' },
    { id: 'sin4', en: 'Needs to develop daily reading habit to enhance vocabulary and comprehension.', mr: 'शब्दसंग्रह आणि वाचन आकलन सुधारण्यासाठी दररोज वाचनाची सवय लावावी.' },
    { id: 'sin5', en: 'Encouraged to actively participate and ask questions in classroom sessions.', mr: 'वर्गातील संवादात अधिक सक्रिय सहभाग घेऊन शंका विचारण्यास प्रोत्साहन द्यावे.' },
    { id: 'sin6', en: 'Needs to maintain neatness and complete all subject notebooks on time.', mr: 'वहीतील टापटीपपणा टिकवून सर्व विषयांचा अभ्यास वेळेवर पूर्ण करावा.' },
    { id: 'sin7', en: 'Requires guidance for deeper conceptual clarity in core topics.', mr: 'महत्त्वाच्या विषयांमध्ये संकल्पनांची स्पष्टता वाढविण्यासाठी अधिक मार्गदर्शनाची गरज आहे.' },
    { id: 'sin8', en: 'Focus on regular attendance and attentive listening during class lectures.', mr: 'नियमित उपस्थिती आणि वर्गात लक्षपूर्वक ऐकण्यावर अधिक लक्ष केंद्रित करावे.' },
  ],
};

export interface CompetencyDomain {
  id: number;
  titleEn: string;
  titleMr: string;
  items: {
    id: number;
    titleEn: string;
    titleMr: string;
  }[];
}

export const COMPETENCY_DOMAINS: CompetencyDomain[] = [
  {
    id: 1,
    titleEn: '1. Scholastic',
    titleMr: 'शैक्षणिक विकास',
    items: [
      { id: 1, titleEn: 'Concept Understanding', titleMr: 'संकल्पना समजण्याची क्षमता' },
      { id: 2, titleEn: 'Subject Knowledge', titleMr: 'विषयाचे ज्ञान' },
      { id: 3, titleEn: 'Problem-Solving Ability', titleMr: 'समस्या सोडविण्याची क्षमता' },
      { id: 4, titleEn: 'Critical Thinking', titleMr: 'विचारपूर्वक आणि सखोल विचार करण्याची क्षमता' },
      { id: 5, titleEn: 'Independent Learning', titleMr: 'स्वावलंबीपणे शिकण्याची क्षमता' },
    ],
  },
  {
    id: 2,
    titleEn: '2. Language & Communication',
    titleMr: 'भाषा व संवाद कौशल्ये',
    items: [
      { id: 1, titleEn: 'Listening Skills', titleMr: 'ऐकण्याची क्षमता' },
      { id: 2, titleEn: 'Speaking Skills', titleMr: 'बोलण्याची क्षमता' },
      { id: 3, titleEn: 'Reading Comprehension', titleMr: 'वाचन आकलन क्षमता' },
      { id: 4, titleEn: 'Writing Skills', titleMr: 'लेखन कौशल्य' },
      { id: 5, titleEn: 'Presentation Skills', titleMr: 'सादरीकरण कौशल्य' },
    ],
  },
  {
    id: 3,
    titleEn: '3. Critical Thinking & Problem-Solving',
    titleMr: 'विचारशक्ती व समस्या सोडविणे',
    items: [
      { id: 1, titleEn: 'Observation Skills', titleMr: 'निरीक्षण करण्याची क्षमता' },
      { id: 2, titleEn: 'Logical Reasoning', titleMr: 'तर्कशुद्ध विचार' },
      { id: 3, titleEn: 'Decision Making', titleMr: 'निर्णय घेण्याची क्षमता' },
      { id: 4, titleEn: 'Questioning / Inquiry', titleMr: 'प्रश्न विचारण्याची व शोध घेण्याची वृत्ती' },
      { id: 5, titleEn: 'Evaluation Skills', titleMr: 'मूल्यांकन करण्याची क्षमता' },
    ],
  },
  {
    id: 4,
    titleEn: '4. Personal, Social & Ethical',
    titleMr: 'वैयक्तिक, सामाजिक व नैतिक विकास',
    items: [
      { id: 1, titleEn: 'Responsibility', titleMr: 'जबाबदारीची जाणीव' },
      { id: 2, titleEn: 'Confidence / Self-awareness', titleMr: 'आत्मविश्वास व स्व-जाणीव' },
      { id: 3, titleEn: 'Teamwork / Cooperation', titleMr: 'संघभावना व सहकार्य' },
      { id: 4, titleEn: 'Honesty / Integrity', titleMr: 'प्रामाणिकपणा व सचोटी' },
      { id: 5, titleEn: 'Emotional Control', titleMr: 'भावनांवर नियंत्रण' },
    ],
  },
  {
    id: 5,
    titleEn: '5. Career Orientation & Life Skills',
    titleMr: 'करिअर व जीवन कौशल्ये',
    items: [
      { id: 1, titleEn: 'Career Awareness', titleMr: 'करिअरची जाणीव' },
      { id: 2, titleEn: 'Goal Setting', titleMr: 'उद्दिष्ट निश्चित करणे' },
      { id: 3, titleEn: 'Self-Management', titleMr: 'स्वतःचे व्यवस्थापन' },
      { id: 4, titleEn: 'Leadership & Entrepreneurship', titleMr: 'नेतृत्व व उद्योजकता' },
      { id: 5, titleEn: 'Future Readiness', titleMr: 'भविष्यासाठी तयारी' },
    ],
  },
  {
    id: 6,
    titleEn: '6. Physical & Emotional Well-being',
    titleMr: 'शारीरिक व भावनिक स्वास्थ्य',
    items: [
      { id: 1, titleEn: 'Physical Fitness', titleMr: 'शारीरिक तंदुरुस्ती' },
      { id: 2, titleEn: 'Participation in Sports / Physical Activities', titleMr: 'खेळ व शारीरिक उपक्रमात सहभाग' },
      { id: 3, titleEn: 'Health & Hygiene Habits', titleMr: 'आरोग्य व स्वच्छतेच्या सवयी' },
      { id: 4, titleEn: 'Healthy Lifestyle Choices', titleMr: 'निरोगी जीवनशैली निवडणे' },
      { id: 5, titleEn: 'Positive Attitude', titleMr: 'सकारात्मक दृष्टिकोन' },
    ],
  },
];

