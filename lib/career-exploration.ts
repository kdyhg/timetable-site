export type CareerRecommendation = {
  id: string;
  area: string;
  region: string;
  university: string;
  departmentGroup: string;
  department: string;
  coreSubjects: string;
  recommendedSubjects: string;
  note: string;
};

export type SubjectOption = {
  id: string;
  label: string;
  group: "국어·언어" | "수학" | "과학·정보" | "사회";
  keywords: string[];
};

export const SUBJECT_OPTIONS: SubjectOption[] = [
  { id: "korean", label: "국어", group: "국어·언어", keywords: ["국어"] },
  { id: "literature", label: "문학", group: "국어·언어", keywords: ["문학"] },
  { id: "english", label: "영어", group: "국어·언어", keywords: ["영어"] },
  { id: "math", label: "수학", group: "수학", keywords: ["수학"] },
  { id: "calculus", label: "미적분", group: "수학", keywords: ["미적분"] },
  { id: "geometry", label: "기하", group: "수학", keywords: ["기하"] },
  {
    id: "probability",
    label: "확률과 통계",
    group: "수학",
    keywords: ["확률과 통계", "확률과통계"],
  },
  { id: "physics", label: "물리학", group: "과학·정보", keywords: ["물리"] },
  { id: "chemistry", label: "화학", group: "과학·정보", keywords: ["화학"] },
  { id: "biology", label: "생명과학", group: "과학·정보", keywords: ["생명과학"] },
  { id: "earth", label: "지구과학", group: "과학·정보", keywords: ["지구과학"] },
  { id: "information", label: "정보", group: "과학·정보", keywords: ["정보", "프로그래밍"] },
  { id: "society", label: "사회", group: "사회", keywords: ["사회"] },
  { id: "economics", label: "경제", group: "사회", keywords: ["경제"] },
  { id: "geography", label: "지리", group: "사회", keywords: ["지리"] },
  { id: "ethics", label: "윤리", group: "사회", keywords: ["윤리"] },
  { id: "politics", label: "정치와 법", group: "사회", keywords: ["정치와 법", "정치와법"] },
];

export const getSubjectText = (record: CareerRecommendation) =>
  `${record.coreSubjects} ${record.recommendedSubjects}`.toLocaleLowerCase("ko");

export const recordMatchesSubject = (
  record: CareerRecommendation,
  option: SubjectOption,
) => {
  const text = getSubjectText(record);
  return option.keywords.some((keyword) =>
    text.includes(keyword.toLocaleLowerCase("ko")),
  );
};

export type PathwayDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  interests: string[];
  groupKeywords: string[];
  departmentKeywords: string[];
  color: string;
  softColor: string;
};

export const PATHWAYS: PathwayDefinition[] = [
  {
    id: "medicine-health",
    label: "의약·보건",
    shortLabel: "의약",
    description: "사람의 건강을 이해하고 치료·돌봄·회복을 돕는 길",
    interests: ["인체와 질병", "생명과학 실험", "돌봄과 소통"],
    groupKeywords: ["의과", "약학", "간호", "보건", "치과", "한의", "수의", "건강"],
    departmentKeywords: ["의예", "의학", "치의", "약학", "간호", "한의", "수의", "물리치료", "작업치료", "방사선", "임상병리", "응급구조", "보건", "재활"],
    color: "#d9485f",
    softColor: "#fff0f2",
  },
  {
    id: "education",
    label: "교육",
    shortLabel: "교육",
    description: "배움의 과정을 설계하고 사람의 성장을 가까이에서 돕는 길",
    interests: ["설명하고 가르치기", "청소년 이해", "교과 깊이 탐구"],
    groupKeywords: ["사범", "교육대"],
    departmentKeywords: ["교육과", "교육학", "초등교육", "특수교육", "유아교육"],
    color: "#805ad5",
    softColor: "#f4efff",
  },
  {
    id: "arts-sports",
    label: "예술·체육",
    shortLabel: "예체능",
    description: "감각과 움직임을 작품·공연·디자인·경기로 표현하는 길",
    interests: ["만들고 표현하기", "공연과 콘텐츠", "몸과 경기 분석"],
    groupKeywords: ["예술", "미술", "체육", "디자인", "음악"],
    departmentKeywords: ["디자인", "미술", "음악", "체육", "스포츠", "연극", "영화", "무용", "조형", "공연"],
    color: "#c26a00",
    softColor: "#fff6e6",
  },
  {
    id: "life-environment",
    label: "생명·환경",
    shortLabel: "생명",
    description: "생명체와 먹거리, 자원, 기후와 환경을 지속 가능하게 다루는 길",
    interests: ["생명 현상", "환경과 기후", "식품·농림·해양"],
    groupKeywords: ["농업", "생명자원", "산림", "수산", "해양", "환경", "바이오시스템"],
    departmentKeywords: ["생명공학", "환경", "산림", "식품", "농", "원예", "해양", "수산", "조경", "동물자원"],
    color: "#27845b",
    softColor: "#eaf8f1",
  },
  {
    id: "engineering-it",
    label: "공학·IT",
    shortLabel: "공학",
    description: "수학과 과학으로 기술을 설계하고 현실의 문제를 해결하는 길",
    interests: ["기계와 구조", "컴퓨터와 데이터", "설계와 문제 해결"],
    groupKeywords: ["공과", "공학", "IT", "소프트웨어", "정보기술", "정보통신", "인공지능", "첨단융합"],
    departmentKeywords: ["컴퓨터", "소프트웨어", "인공지능", "전자", "전기", "기계", "건축공학", "토목", "산업공학", "로봇", "모빌리티", "반도체", "데이터"],
    color: "#0075de",
    softColor: "#e8f3fc",
  },
  {
    id: "natural-science",
    label: "자연과학",
    shortLabel: "자연",
    description: "수와 자연 현상의 원리를 관찰하고 설명하는 길",
    interests: ["원리와 증명", "실험과 관찰", "자료 분석"],
    groupKeywords: ["자연과학", "이과대", "자연계열"],
    departmentKeywords: ["수학과", "물리학", "화학과", "생명과학", "지질", "통계학", "천문", "대기과학"],
    color: "#257a9b",
    softColor: "#e9f6fa",
  },
  {
    id: "business-social",
    label: "사회·경영",
    shortLabel: "사회",
    description: "사람과 조직, 시장과 제도가 움직이는 방식을 탐구하는 길",
    interests: ["사회 현상", "기업과 시장", "정책과 미디어"],
    groupKeywords: ["사회과학", "경영", "경상", "법", "국제"],
    departmentKeywords: ["경영", "경제", "행정", "정치", "사회", "심리", "언론", "미디어", "법학", "국제", "관광", "무역", "회계", "금융"],
    color: "#b0573a",
    softColor: "#fff1eb",
  },
  {
    id: "humanities-language",
    label: "인문·언어",
    shortLabel: "인문",
    description: "언어와 역사, 사상과 문화를 통해 사람과 세계를 읽는 길",
    interests: ["읽고 쓰기", "언어와 문화", "역사와 철학"],
    groupKeywords: ["인문", "언어", "문과"],
    departmentKeywords: ["국어국문", "영어영문", "문학", "철학", "역사", "사학", "언어", "문화", "고고", "문헌정보"],
    color: "#76664f",
    softColor: "#f5f1eb",
  },
  {
    id: "open-convergence",
    label: "융합·자유전공",
    shortLabel: "융합",
    description: "여러 분야를 넘나들며 스스로 전공 방향을 조합하는 길",
    interests: ["여러 분야 연결", "전공 탐색", "새로운 문제 정의"],
    groupKeywords: ["융합", "자유전공", "미래인재", "독립학부"],
    departmentKeywords: ["융합", "자유전공", "자율전공", "글로벌", "미래"],
    color: "#5d6875",
    softColor: "#eef1f4",
  },
];

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword.toLocaleLowerCase("ko")));

export const getPathwayId = (record: CareerRecommendation) => {
  const group = record.departmentGroup.toLocaleLowerCase("ko");
  const department = record.department.toLocaleLowerCase("ko");

  for (const pathway of PATHWAYS) {
    if (
      includesAny(group, pathway.groupKeywords) ||
      includesAny(department, pathway.departmentKeywords)
    ) {
      return pathway.id;
    }
  }

  return "open-convergence";
};

export const getTopSubjects = (
  records: CareerRecommendation[],
  limit = 5,
) =>
  SUBJECT_OPTIONS.map((option) => ({
    label: option.label,
    count: records.filter((record) => recordMatchesSubject(record, option)).length,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"))
    .slice(0, limit);
