// 샘플 연결 데이터 (개발/테스트용)
export const SAMPLE_CONNECTIONS = [
  {
    id: "sample-1",
    name: "예시:지안",
    type: "couple" as const,
    connected: true,
    recentKeyword: "행복",
    sharedDays: 45
  },
  {
    id: "sample-2", 
    name: "예시:조춘배",
    type: "business" as const,
    connected: true,
    recentKeyword: "성장",
    sharedDays: 12
  },
  {
    id: "sample-3",
    name: "예시:김친구",
    type: "custom" as const,
    customName: "친구",
    connected: true,
    recentKeyword: "우정",
    sharedDays: 30
  },
  {
    id: "sample-4",
    name: "예시:박가족",
    type: "custom" as const,
    customName: "가족",
    connected: true,
    recentKeyword: "사랑",
    sharedDays: 365
  }
];