# Mermaid 샘플

yazi에서 이 파일에 커서를 올리면 오른쪽 미리보기에 다이어그램이 **글자 그림**으로 보여요.
`O` 메뉴에서 다이어그램 그림 보기를 고르면, Ghostty 같은 터미널에서 그림으로 하나씩 볼 수 있어요.

## 1. 흐름도 (flowchart)

```mermaid
graph LR
  A[사용자 요청] --> B{로그인 했나요?}
  B -->|예| C[주문 처리]
  B -->|아니요| D[로그인 화면]
  C --> E[결제 완료]
```

## 2. 시퀀스 (sequence)

```mermaid
sequenceDiagram
  사용자->>서버: 주문 요청
  서버->>결제: 결제 승인 요청
  결제-->>서버: 승인 완료
  서버-->>사용자: 주문 완료
```

## 3. ER 다이어그램

```mermaid
erDiagram
  회원 ||--o{ 주문 : 넣는다
  주문 ||--|{ 주문상품 : 담는다
  상품 ||--o{ 주문상품 : 들어간다
  회원 {
    int 회원번호
    string 이름
  }
  주문 {
    int 주문번호
    date 주문일
  }
```

## 4. 상태 (state)

```mermaid
stateDiagram-v2
  [*] --> 대기
  대기 --> 처리중 : 결제
  처리중 --> 완료 : 배송
  처리중 --> 취소 : 환불
  완료 --> [*]
```

## 5. 클래스 (class)

```mermaid
classDiagram
  class 주문 {
    +int 번호
    +결제하기()
  }
  class 회원 {
    +string 이름
  }
  회원 "1" --> "*" 주문 : 가진다
```

## 6. 막대 차트 (xychart)

```mermaid
xychart-beta
  title "월별 주문 수"
  x-axis [1월, 2월, 3월, 4월]
  y-axis "주문" 0 --> 100
  bar [30, 45, 70, 90]
```
