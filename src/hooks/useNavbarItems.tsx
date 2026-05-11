import { useTranslation } from "react-i18next";

export interface NavbarItemData {
  title: string;
  to: string;
  id: string;
}

export const useNavbarItems = (): NavbarItemData[] => {
  const { t } = useTranslation();

  return [
    { title: t("nav.about"), to: "/#about", id: "about" },
    { title: t("nav.services"), to: "/#services", id: "services" },
    { title: t("nav.projects"), to: "/#projects", id: "projects" },
    { title: t("nav.skills"), to: "/#skills", id: "skills" },
    // { title: t("nav.reviews"), to: "/#reviews", id: "reviews" },
    { title: t("nav.contacts"), to: "/#contacts", id: "contacts" },
  ];
};
