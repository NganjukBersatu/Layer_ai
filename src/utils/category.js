import { useI18n } from "vue-i18n";

const categoryKeyMap = {
  anime: "filterAnime",
  chibi: "filterChibi",
  furry: "filterFurry",
  kawaii: "filterKawaii",
  spyxfamily: "filterSpyXFamily",
  jujutsukaisen: "filterJujutsuKaisen",
  naruto: "filterNaruto",
  waifu: "filterWaifu",
  husbando: "filterHusbando",
  blackbutler: "filterBlackButler",
  detectiveconan: "filterDetectiveConan",
};

export function normalizeTag(tag) {
  return tag.toLowerCase().replace(/[\s_-]+/g, "");
}

export function useCategoryLabel() {
  const { t } = useI18n();
  return (tag) => {
    const key = categoryKeyMap[normalizeTag(tag)];
    return key ? t(`catalog.${key}`) : tag;
  };
}