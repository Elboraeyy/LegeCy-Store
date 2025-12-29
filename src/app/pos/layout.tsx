"use client";

import React from 'react';
import './pos.css';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pos-body">
            {children}
        </div>
    );
}
