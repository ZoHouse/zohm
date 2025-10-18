import { useCallback, useMemo } from "react";
import { ProfileFields } from "@/utils/profile";
import { RadioSheet } from "@/components/sheets";
import useProfile from "@/hooks/useProfile";

interface GenderSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  gender: string;
}

const GenderSheet = ({ isOpen, onDismiss, gender }: GenderSheetProps) => {
  const selected = useMemo(
    () => ProfileFields.gender.find((g) => g.id === gender),
    [gender]
  );

  const { updateProfile } = useProfile();

  const fields = useMemo(() => {
    return ProfileFields.gender.map((g) => ({
      id: g.id,
      title: g.value,
      emoji: g.icon,
    }));
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      const gender = ProfileFields.gender.find((g) => g.id === id);
      if (gender) {
        updateProfile({ gender: gender.id });
      }
      onDismiss();
    },
    [onDismiss]
  );

  return (
    <RadioSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      selected={selected?.id}
      onSelect={handleSelect}
      items={fields}
    />
  );
};

export default GenderSheet;
