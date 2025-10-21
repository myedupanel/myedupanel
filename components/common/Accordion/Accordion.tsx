"use client";
import React, { useState } from 'react';
import styles from './Accordion.module.scss';
import { FiChevronDown } from 'react-icons/fi';

// Types for props
type AccordionItemProps = {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onClick?: () => void;
};

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => {
    return (
        <div className={styles.item}>
            <button className={styles.header} onClick={onClick}>
                <h3 className={styles.title}>{title}</h3>
                <FiChevronDown className={`${styles.icon} ${isOpen ? styles.open : ''}`} />
            </button>
            {isOpen && (
                <div className={styles.content}>
                    {children}
                </div>
            )}
        </div>
    );
};

type AccordionProps = {
    children: React.ReactNode;
};

const Accordion: React.FC<AccordionProps> & { Item: React.FC<AccordionItemProps> } = ({ children }) => {
    const [openIndex, setOpenIndex] = useState(0); // Default mein pehla item khula rakhega

    return (
        <div className={styles.accordion}>
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
                        isOpen: index === openIndex,
                        onClick: () => setOpenIndex(index === openIndex ? -1 : index),
                    });
                }
                return child;
            })}
        </div>
    );
};

Accordion.Item = AccordionItem;
export default Accordion;