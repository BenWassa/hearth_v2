export function keepCardInView(event) {
  event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}
