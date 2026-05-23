import React from "react";

import { IconWrapper } from "../../components";

import LogoTelegram from "./IconLogoTelegram.svg";
import LogoInstagram from "./IconLogoInstagram.svg";
import LogoVK from "./IconLogoVK.svg";
import LogoThreads from "./IconLogoThreads.svg";
import LogoGitHub from "./IconLogoGitHub.svg";
import Code from "./IconCode.svg";
import Prototype from "./IconPrototype.svg";
import Pen from "./IconPen.svg";
import Layers from "./IconLayers.svg";
import Attach from "./IconAttach.svg";
import LangRU from "./IconLangRU.svg";
import LangEN from "./IconLangEN.svg";
import Moon from "./IconMoon.svg";
import Sun from "./IconSun.svg";
import Settings from "./IconSettings.svg";
import Globe from "./IconGlobe.svg";
import LogoOK from "./IconLogoOK.svg";

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  viewBox?: string;
  strokeWidth?: number;
}

export const IconGlobe = (props: IconProps) => (
  <IconWrapper {...props}>
    <Globe />
  </IconWrapper>
);

export const IconLogoTelegram = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoTelegram />
  </IconWrapper>
);

export const IconLogoInstagram = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoInstagram />
  </IconWrapper>
);

export const IconLogoVK = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoVK />
  </IconWrapper>
);

export const IconLogoOK = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoOK />
  </IconWrapper>
);

export const IconLogoThreads = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoThreads />
  </IconWrapper>
);

export const IconLogoGitHub = (props: IconProps) => (
  <IconWrapper {...props}>
    <LogoGitHub />
  </IconWrapper>
);

export const IconCode = (props: IconProps) => (
  <IconWrapper {...props}>
    <Code />
  </IconWrapper>
);

export const IconPrototype = (props: IconProps) => (
  <IconWrapper {...props}>
    <Prototype />
  </IconWrapper>
);

export const IconPen = (props: IconProps) => (
  <IconWrapper {...props}>
    <Pen />
  </IconWrapper>
);

export const IconLayers = (props: IconProps) => (
  <IconWrapper {...props}>
    <Layers />
  </IconWrapper>
);

export const IconAttach = (props: IconProps) => (
  <IconWrapper {...props}>
    <Attach />
  </IconWrapper>
);

export const IconLangRU = (props: IconProps) => (
  <IconWrapper thereColor {...props}>
    <LangRU />
  </IconWrapper>
);

export const IconLangEN = (props: IconProps) => (
  <IconWrapper thereColor {...props}>
    <LangEN />
  </IconWrapper>
);

export const IconMoon = (props: IconProps) => (
  <IconWrapper thereColor fill="none" {...props}>
    <Moon />
  </IconWrapper>
);

export const IconSun = (props: IconProps) => (
  <IconWrapper thereColor fill="none" {...props}>
    <Sun />
  </IconWrapper>
);

export const IconSettings = (props: IconProps) => (
  <IconWrapper thereColor fill="none" {...props}>
    <Settings />
  </IconWrapper>
);
