/** 순서 바꾸기를 나타내는 손잡이 모양이다. 장식용이며 아직 순서를 바꾸는 동작은 없다. */
export const GroupDragHandle = () => (
  <span aria-hidden="true" className="flex h-full shrink-0 items-center gap-0.5 py-1.25">
    <span className="h-2.5 w-px bg-text-muted/70" />
    <span className="h-2.5 w-px bg-text-muted/70" />
  </span>
)
