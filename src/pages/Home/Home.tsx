import React from "react";

import styles from "./Home.module.scss";

import {
  AboutSection,
  ContactsSection,
  ProjectsSection,
  ReviewsSection,
  ServicesSection,
  SkillsSection,
} from "@/components";

export const Home = ({}) => {
  return (
    <div className={styles.wrapper}>
      <AboutSection id="about" />
      <ServicesSection id="services" />
      <ProjectsSection id="projects" />
      <div>
        <SkillsSection id="skills" />
        <ReviewsSection id="reviews" />
      </div>
      <ContactsSection id="contacts" />
    </div>
  );
};
