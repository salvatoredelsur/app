interface Props {
  color: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  size?: number;
}

export function Blob({ color, top, left, right, bottom, size = 200 }: Props) {
  return (
    <div style={{
      position:'absolute', top, left, right, bottom,
      width:size, height:size, borderRadius:'50%',
      background:color, opacity:.06, filter:'blur(60px)', pointerEvents:'none',
    }}/>
  );
}
