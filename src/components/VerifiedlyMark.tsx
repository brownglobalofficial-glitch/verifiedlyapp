import verifiedlyMark from "@/assets/verifiedly-mark";
import { cn } from "@/lib/utils";

type VerifiedlyMarkProps = {
  className?: string;
  /** Decorative marks next to the word "Verifiedly" should stay unlabeled. */
  alt?: string;
};

/**
 * The official Verifiedly V mark. The source is a transparent, tightly cropped
 * PNG inlined as a data URI so sign-in and OAuth consent screens never show a
 * broken or white-boxed icon while an asset request is in flight.
 */
const VerifiedlyMark = ({ className, alt = "" }: VerifiedlyMarkProps) => (
  <img
    src={verifiedlyMark}
    alt={alt}
    aria-hidden={alt === "" ? true : undefined}
    width={512}
    height={512}
    className={cn("object-contain dark:invert", className)}
  />
);

export default VerifiedlyMark;
