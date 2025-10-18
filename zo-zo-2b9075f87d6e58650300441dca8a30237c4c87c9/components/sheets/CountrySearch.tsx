import React, { useCallback } from "react";
import { CountryCodeType } from "@/definitions/auth";
import { ZoCountry } from "@/definitions/zo";
import ListSearch from "@/components/sheets/ListSearch";
import NumberSearchListItem from "@/components/ui/NumberSearchListItem";
import useQuery from "@/hooks/useQuery";

const fuseOptions = { keys: ["name", "dial_code"] };

interface CountrySearchProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedValue: ZoCountry | null;
  onSelectCountry?: (code: ZoCountry) => void;
  onSelectCountryCode?: (code: string) => void;
}

const CountrySearch = ({
  isOpen,
  onDismiss,
  selectedValue,
  onSelectCountryCode,
  onSelectCountry,
}: CountrySearchProps) => {
  const { data: countries } = useQuery(
    "ZO_COUNTRIES",
    {
      select: (data) => data.data.results,
    },
    {
      search: {
        limit: "300",
      },
    }
  );

  const _onSelectCountry = useCallback(
    (item: ZoCountry) => {
      onSelectCountry?.(item);
      onDismiss();
    },
    [onSelectCountry, onDismiss]
  );

  const onSelectCode = useCallback(
    (item: CountryCodeType) => {
      onSelectCountryCode?.(item.code);
    },
    [onSelectCountryCode]
  );

  const countryItemRenderer = useCallback(
    ({ item }: { item: ZoCountry }) => {
      const countryCode = {
        name: item.name,
        flag: item.flag,
        code: item.code,
        dial_code: item.mobile_code,
      };

      const onSelect = onSelectCountryCode
        ? onSelectCode
        : () => _onSelectCountry(item);

      return (
        <NumberSearchListItem
          item={countryCode}
          select={onSelect}
          isSelected={item.code === selectedValue?.code}
          showDialCode={false}
        />
      );
    },
    [selectedValue?.code, onSelectCode, _onSelectCountry]
  );

  if (!countries) return null;

  return (
    <ListSearch
      onDismiss={onDismiss}
      isOpen={isOpen}
      listData={countries}
      selectedValue={selectedValue}
      keyExtractor={(item) => item.code}
      renderItem={countryItemRenderer}
      fuseOptions={fuseOptions}
    />
  );
};

export default CountrySearch;
