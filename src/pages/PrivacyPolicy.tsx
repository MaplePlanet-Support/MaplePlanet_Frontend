export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-foreground leading-relaxed">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>

      <p className="text-muted-foreground mb-6">
        본 방침은 PlanetCompare(이하 "서비스")가 수집하는 정보와 그 이용 방법에 대해 설명합니다.
      </p>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">1. 수집하는 정보</h2>
        <p className="text-muted-foreground">
          서비스는 별도의 회원가입 없이 이용 가능하며, 개인 식별 정보를 직접 수집하지 않습니다.
          다만 프리셋 저장 기능 이용 시 사용자가 직접 입력한 닉네임 및 설정 데이터가 서버에 저장됩니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">2. 제3자 광고 및 쿠키</h2>
        <p className="text-muted-foreground mb-2">
          서비스는 Google AdSense를 통해 광고를 게재합니다. Google은 쿠키를 사용하여 사용자의 관심사에 맞는 광고를 표시할 수 있습니다.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Google의 광고 쿠키 사용은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline">Google 개인정보처리방침</a>을 따릅니다.</li>
          <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-foreground underline">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</li>
          <li>또는 <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-foreground underline">aboutads.info</a>에서 제3자 쿠키를 거부할 수 있습니다.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">3. 로그 데이터</h2>
        <p className="text-muted-foreground">
          서비스 접속 시 IP 주소, 브라우저 종류, 방문 시각 등의 로그 데이터가 서버에 자동으로 기록될 수 있습니다.
          이 데이터는 서비스 운영 및 보안 목적으로만 사용됩니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">4. 정보의 보관 및 삭제</h2>
        <p className="text-muted-foreground">
          저장된 프리셋 데이터는 서비스 운영 기간 동안 보관됩니다.
          데이터 삭제를 원하시는 경우 아래 이메일로 문의해 주세요.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">5. 문의</h2>
        <p className="text-muted-foreground">
          개인정보 관련 문의사항은 아래 이메일로 연락해 주세요.
          <br />
          <a href="mailto:tjdwkddl@gmail.com" className="text-foreground underline">tjdwkddl@gmail.com</a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground mt-8">최종 수정일: 2026년 5월 20일</p>
    </div>
  )
}
