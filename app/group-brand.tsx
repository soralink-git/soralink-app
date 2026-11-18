import Image from 'next/image';

export default function GroupBrand({
  division = 'Link',
}: {
  division?: 'Link' | 'Print' | 'Connect';
}) {
  const name = 'sora' + division.toLowerCase();
  const width = { Link: 454, Print: 468, Connect: 553 }[division];
  return (
    <span className="group-brand" dir="ltr">
      <Image
        unoptimized
        className="group-logo group-logo-light"
        src={'/brand/' + name + '-color.svg?v=reference-02'}
        alt={'Sora' + division}
        width={width}
        height={149}
      />
      <Image
        unoptimized
        className="group-logo group-logo-dark"
        src={'/brand/' + name + '-on-dark.svg?v=reference-02'}
        alt={'Sora' + division}
        width={width}
        height={149}
      />
    </span>
  );
}
