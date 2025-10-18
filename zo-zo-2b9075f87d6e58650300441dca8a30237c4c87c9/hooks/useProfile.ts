import { useAuth } from "@/context/AuthContext";
import useMutation from "./useMutation";
import useQuery from "./useQuery";
import { useCallback } from "react";
import { logAxiosError } from "@/utils/network";

const useProfile = () => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  const {
    data: profile,
    isLoading,
    isFetching,
    refetch: refetchProfile,
  } = useQuery("PROFILE_ME", {
    enabled: isAuthenticated === true,
    select: (data) => data.data,
  });

  const {
    data: zostelProfile,
    refetch: refetchZostelProfile,
    isLoading: isZostelProfileLoading,
    isRefetching: isZostelProfileRefetching,
  } = useQuery("PROFILE_ME_ZOSTEL", {
    enabled: isAuthenticated === true,
    select: (data) => data.data.profile,
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
  });

  const { mutate: updateProfile, isPending } = useMutation("PROFILE_ME", {
    onSuccess: () => {
      refetchProfile();
    },
    onError: (er) => {
      logAxiosError(er);
    },
  });

  const { mutateAsync: _updateProfile } = useMutation("PROFILE_ME");

  const updateProfileAsync = useCallback(
    (data: Parameters<typeof _updateProfile>[0]) => {
      return _updateProfile(data).then(() => refetchProfile());
    },
    [_updateProfile, refetchProfile]
  );

  return {
    profile: profile,
    updateProfile,
    updateProfileAsync,
    isLoading: isLoading || isFetching,
    isUpdating: isPending || isFetching || isLoading,
    refetchProfile,
    zostelProfile,
    isZostelProfileLoading,
    isZostelProfileRefetching,
    refetchZostelProfile,
  };
};

export default useProfile;
