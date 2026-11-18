export const S_PATH = 'M49 12 L23 21 C10 25 13 36 28 34 L36 33 C51 31 54 42 40 47 L14 56';
export default function GroupBrand({
  division = 'Link',
}: {
  division?: 'Link' | 'Print' | 'Connect';
}) {
  const color = { Link: '#F47721', Print: '#F5C928', Connect: '#D93636' }[division];
  return (
    <span className="group-brand" dir="ltr">
      <svg viewBox="0 0 64 68" width="46" height="49" aria-hidden="true">
        <path
          d={S_PATH}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Sora{division}</span>
    </span>
  );
}
