/**
 * Generated from the backend OpenAPI schema. Do not edit manually.
 * Regenerate with: npm run generate:types
 */
export interface paths {
    "/items/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Item */
        post: operations["create_item_items__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/items/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Item */
        get: operations["get_item_items__item_id__get"];
        put?: never;
        post?: never;
        /** Delete Item */
        delete: operations["delete_item_items__item_id__delete"];
        options?: never;
        head?: never;
        /** Update Item */
        patch: operations["update_item_items__item_id__patch"];
        trace?: never;
    };
    "/items/{item_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload Cover */
        post: operations["upload_cover_items__item_id__cover_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/items/{item_id}/icon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload Icon */
        post: operations["upload_icon_items__item_id__icon_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/items/{item_id}/icon/from-cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Icon From Cover */
        post: operations["generate_icon_from_cover_items__item_id__icon_from_cover_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/items/itemlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Item List */
        get: operations["item_list_items_itemlist_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/media/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Media */
        get: operations["list_media_media__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/author-roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_author_roles_get"];
        put?: never;
        /** Create Author Roles */
        post: operations["create_author_roles_reference_author_roles_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/authors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Authors */
        get: operations["authors_reference_authors_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/barcode-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_barcode_types_get"];
        put?: never;
        /** Create Barcode Types */
        post: operations["create_barcode_types_reference_barcode_types_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/companies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Companies */
        get: operations["companies_reference_companies_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/company-roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_company_roles_get"];
        put?: never;
        /** Create Company Roles */
        post: operations["create_company_roles_reference_company_roles_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/condition-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_condition_types_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/formats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Formats */
        get: operations["formats_reference_formats_get"];
        put?: never;
        /** Create Formats */
        post: operations["create_formats_reference_formats_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/franchises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_franchises_get"];
        put?: never;
        /** Create Franchises */
        post: operations["create_franchises_reference_franchises_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/game-platforms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_game_platforms_get"];
        put?: never;
        /** Create Game Platforms */
        post: operations["create_game_platforms_reference_game_platforms_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/genres": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Genres */
        get: operations["genres_reference_genres_get"];
        put?: never;
        /** Create Genres */
        post: operations["create_genres_reference_genres_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/item-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Item Types
         * @description Item types with the formats and genres that apply to each.
         */
        get: operations["item_types_reference_item_types_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/journals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_journals_get"];
        put?: never;
        /** Create Journals */
        post: operations["create_journals_reference_journals_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/languages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_languages_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/scales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_scales_get"];
        put?: never;
        /** Create Scales */
        post: operations["create_scales_reference_scales_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reference/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Handler */
        get: operations["handler_reference_tags_get"];
        put?: never;
        /** Create Tags */
        post: operations["create_tags_reference_tags_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AuthorCreditCreate */
        AuthorCreditCreate: {
            /** Author Id */
            author_id?: number | null;
            /** Author Name */
            author_name?: string | null;
            /** Comments */
            comments?: string | null;
            /** Involvement Date */
            involvement_date?: string | null;
            /** Role Name */
            role_name: string;
        } & ({
            author_id: number;
            author_name?: null;
        } | {
            author_id?: null;
            author_name: string;
        });
        /** AuthorCreditRead */
        AuthorCreditRead: {
            author: components["schemas"]["AuthorRead"];
            /** Comments */
            comments: string | null;
            /** Involvement Date */
            involvement_date: string | null;
            role: components["schemas"]["AuthorRoleRead"];
        };
        /** AuthorRead */
        AuthorRead: {
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** AuthorRoleRead */
        AuthorRoleRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** BarcodeCreate */
        BarcodeCreate: {
            /** Barcode Type Id */
            barcode_type_id?: number | null;
            /** Code */
            code: string;
        };
        /** BarcodeRead */
        BarcodeRead: {
            barcode_type: components["schemas"]["BarcodeTypeRead"] | null;
            /** Code */
            code: string;
            /** Id */
            id: number;
        };
        /** BarcodeTypeRead */
        BarcodeTypeRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** BoardGameDetailsCreate */
        BoardGameDetailsCreate: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "board_game";
        };
        /** BoardGameDetailsRead */
        BoardGameDetailsRead: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "board_game";
        };
        /** Body_upload_cover_items__item_id__cover_post */
        Body_upload_cover_items__item_id__cover_post: {
            /** File */
            file: string;
        };
        /** Body_upload_icon_items__item_id__icon_post */
        Body_upload_icon_items__item_id__icon_post: {
            /** File */
            file: string;
        };
        /** BookDetailsCreate */
        BookDetailsCreate: {
            /** Page Count */
            page_count?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "book";
        };
        /** BookDetailsRead */
        BookDetailsRead: {
            /** Page Count */
            page_count: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "book";
        };
        /** CompanyCreditCreate */
        CompanyCreditCreate: {
            /** Comments */
            comments?: string | null;
            /** Company Id */
            company_id?: number | null;
            /** Company Name */
            company_name?: string | null;
            /** Involvement Date */
            involvement_date?: string | null;
            /** Role Name */
            role_name: string;
        } & ({
            company_id: number;
            company_name?: null;
        } | {
            company_id?: null;
            company_name: string;
        });
        /** CompanyCreditRead */
        CompanyCreditRead: {
            /** Comments */
            comments: string | null;
            company: components["schemas"]["CompanyRead"];
            /** Involvement Date */
            involvement_date: string | null;
            role: components["schemas"]["CompanyRoleRead"];
        };
        /** CompanyRead */
        CompanyRead: {
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** CompanyRoleRead */
        CompanyRoleRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** ConditionRead */
        ConditionRead: {
            condition_type: components["schemas"]["ConditionTypeRead"] | null;
            /** Notes */
            notes: string | null;
        };
        /** ConditionTypeRead */
        ConditionTypeRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** CopyPhotoRead */
        CopyPhotoRead: {
            /** Description */
            description: string | null;
            /** File Path */
            file_path: string;
            /** Id */
            id: number;
            /** Name */
            name: string | null;
        };
        /** FigurineDetailsCreate */
        FigurineDetailsCreate: {
            /** Scale Id */
            scale_id?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "figurine";
        };
        /** FigurineDetailsRead */
        FigurineDetailsRead: {
            scale: components["schemas"]["ScaleRead"] | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "figurine";
        };
        /** FilmDetailsCreate */
        FilmDetailsCreate: {
            /**
             * Length
             * @description minutes
             */
            length?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "film";
        };
        /** FilmDetailsRead */
        FilmDetailsRead: {
            /** Length */
            length: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "film";
        };
        /** FormatRead */
        FormatRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
            /** Short Name */
            short_name: string | null;
        };
        /** FranchiseRead */
        FranchiseRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
            /** Parent Franchise Id */
            parent_franchise_id: number | null;
        };
        /** GameDetailsCreate */
        GameDetailsCreate: {
            /** Game Platform Id */
            game_platform_id?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "game";
        };
        /** GameDetailsRead */
        GameDetailsRead: {
            game_platform: components["schemas"]["GamePlatformRead"] | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "game";
        };
        /** GamePlatformRead */
        GamePlatformRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
            /** Short Name */
            short_name: string | null;
        };
        /** GenreRead */
        GenreRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
            /** Parent Genre Id */
            parent_genre_id: number | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** ItemCreate */
        ItemCreate: {
            /**
             * Author Credits
             * @default []
             */
            author_credits?: components["schemas"]["AuthorCreditCreate"][];
            /**
             * Barcodes
             * @default []
             */
            barcodes?: components["schemas"]["BarcodeCreate"][];
            /**
             * Company Credits
             * @default []
             */
            company_credits?: components["schemas"]["CompanyCreditCreate"][];
            /** Cover Image Path */
            cover_image_path?: string | null;
            /** Description */
            description?: string | null;
            /** Details */
            details: components["schemas"]["BookDetailsCreate"] | components["schemas"]["GameDetailsCreate"] | components["schemas"]["FilmDetailsCreate"] | components["schemas"]["BoardGameDetailsCreate"] | components["schemas"]["JournalIssueDetailsCreate"] | components["schemas"]["FigurineDetailsCreate"] | components["schemas"]["MiniatureDetailsCreate"] | components["schemas"]["LegoSetDetailsCreate"];
            /** Format Id */
            format_id?: number | null;
            /**
             * Franchise Ids
             * @default []
             */
            franchise_ids?: number[];
            /**
             * Genre Ids
             * @default []
             */
            genre_ids?: number[];
            /** Icon Image Path */
            icon_image_path?: string | null;
            /** Is Owned */
            is_owned?: boolean | null;
            /**
             * Languages
             * @default []
             */
            languages?: components["schemas"]["ItemLanguageCreate"][];
            /** Release Date */
            release_date?: string | null;
            /** Selected Language Code */
            selected_language_code?: string | null;
            /**
             * Tags
             * @description tag names; created if missing
             * @default []
             */
            tags?: string[];
            /** Titles */
            titles: components["schemas"]["TitleCreate"][];
        };
        /** ItemLanguageCreate */
        ItemLanguageCreate: {
            /** Language Code */
            language_code: string;
            /** Text */
            text?: boolean | null;
            /** Ui */
            ui?: boolean | null;
            /** Voice */
            voice?: boolean | null;
        };
        /** ItemLanguageRead */
        ItemLanguageRead: {
            language: components["schemas"]["LanguageRead"];
            /** Text */
            text: boolean | null;
            /** Ui */
            ui: boolean | null;
            /** Voice */
            voice: boolean | null;
        };
        /** ItemListEntryRead */
        ItemListEntryRead: {
            /** Date Added */
            date_added: string | null;
            /** Description */
            description: string | null;
            /** Icon Image Path */
            icon_image_path: string | null;
            /** Id */
            id: number;
            /** Is Owned */
            is_owned: boolean;
            /** Item Type */
            item_type: string;
            /** Release Date */
            release_date: string | null;
            /** Title */
            title: string;
        };
        /** ItemRead */
        ItemRead: {
            /** Author Credits */
            author_credits: components["schemas"]["AuthorCreditRead"][];
            /** Barcodes */
            barcodes: components["schemas"]["BarcodeRead"][];
            /** Company Credits */
            company_credits: components["schemas"]["CompanyCreditRead"][];
            /** Cover Image Path */
            cover_image_path: string | null;
            /** Description */
            description: string | null;
            /** Details */
            details: (components["schemas"]["BookDetailsRead"] | components["schemas"]["GameDetailsRead"] | components["schemas"]["FilmDetailsRead"] | components["schemas"]["BoardGameDetailsRead"] | components["schemas"]["JournalIssueDetailsRead"] | components["schemas"]["FigurineDetailsRead"] | components["schemas"]["MiniatureDetailsRead"] | components["schemas"]["LegoSetDetailsRead"]) | null;
            /** Display Title */
            readonly display_title: string;
            format: components["schemas"]["FormatRead"] | null;
            /** Franchises */
            franchises: components["schemas"]["FranchiseRead"][];
            /** Genres */
            genres: components["schemas"]["GenreRead"][];
            /** Icon Image Path */
            icon_image_path: string | null;
            /** Id */
            id: number;
            /** Is Owned */
            is_owned: boolean | null;
            item_type: components["schemas"]["ItemTypeRead"];
            /** Languages */
            languages: components["schemas"]["ItemLanguageRead"][];
            /** Owned Copies */
            owned_copies: components["schemas"]["OwnedCopyRead"][];
            /** Release Date */
            release_date: string | null;
            selected_language: components["schemas"]["LanguageRead"] | null;
            /** Tags */
            tags: components["schemas"]["TagRead"][];
            /** Titles */
            titles: components["schemas"]["TitleRead"][];
        };
        /** ItemTypeRead */
        ItemTypeRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /**
         * ItemTypeScopeRead
         * @description Item type with the formats and genres that apply to it (for form dropdowns).
         */
        ItemTypeScopeRead: {
            /** Description */
            description: string | null;
            /** Formats */
            formats: components["schemas"]["FormatRead"][];
            /** Genres */
            genres: components["schemas"]["GenreRead"][];
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /**
         * ItemUpdate
         * @description Partial update. Omitted = leave alone; a list = replace the whole collection.
         *     `details` is partial too, and its type_name must match the item's current type.
         */
        ItemUpdate: {
            /** Author Credits */
            author_credits?: components["schemas"]["AuthorCreditCreate"][] | null;
            /** Barcodes */
            barcodes?: components["schemas"]["BarcodeCreate"][] | null;
            /** Company Credits */
            company_credits?: components["schemas"]["CompanyCreditCreate"][] | null;
            /** Cover Image Path */
            cover_image_path?: string | null;
            /** Description */
            description?: string | null;
            /** Details */
            details?: (components["schemas"]["BookDetailsCreate"] | components["schemas"]["GameDetailsCreate"] | components["schemas"]["FilmDetailsCreate"] | components["schemas"]["BoardGameDetailsCreate"] | components["schemas"]["JournalIssueDetailsCreate"] | components["schemas"]["FigurineDetailsCreate"] | components["schemas"]["MiniatureDetailsCreate"] | components["schemas"]["LegoSetDetailsCreate"]) | null;
            /** Format Id */
            format_id?: number | null;
            /** Franchise Ids */
            franchise_ids?: number[] | null;
            /** Genre Ids */
            genre_ids?: number[] | null;
            /** Icon Image Path */
            icon_image_path?: string | null;
            /** Is Owned */
            is_owned?: boolean | null;
            /** Languages */
            languages?: components["schemas"]["ItemLanguageCreate"][] | null;
            /** Release Date */
            release_date?: string | null;
            /** Selected Language Code */
            selected_language_code?: string | null;
            /** Tags */
            tags?: string[] | null;
            /** Titles */
            titles?: components["schemas"]["TitleCreate"][];
        };
        /** JournalIssueDetailsCreate */
        JournalIssueDetailsCreate: {
            /** Issue */
            issue?: string | null;
            /** Journal Id */
            journal_id?: number | null;
            /** Page Count */
            page_count?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "journal_issue";
        };
        /** JournalIssueDetailsRead */
        JournalIssueDetailsRead: {
            /** Issue */
            issue: string | null;
            journal: components["schemas"]["JournalRead"] | null;
            /** Page Count */
            page_count: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "journal_issue";
        };
        /** JournalRead */
        JournalRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** LanguageRead */
        LanguageRead: {
            /** Code */
            code: string;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** LegoSetDetailsCreate */
        LegoSetDetailsCreate: {
            /** Number Of Pieces */
            number_of_pieces?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "lego_set";
        };
        /** LegoSetDetailsRead */
        LegoSetDetailsRead: {
            /** Number Of Pieces */
            number_of_pieces: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "lego_set";
        };
        /** MediaFileRead */
        MediaFileRead: {
            /** Name */
            name: string;
            /** Path */
            path: string;
            /** Relative Path */
            relative_path: string;
            /** Size Bytes */
            size_bytes: number;
        };
        /** MiniatureDetailsCreate */
        MiniatureDetailsCreate: {
            /** Height */
            height?: number | null;
            /** Scale Id */
            scale_id?: number | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "miniature";
            /** Width */
            width?: number | null;
        };
        /** MiniatureDetailsRead */
        MiniatureDetailsRead: {
            /** Height */
            height: number | null;
            scale: components["schemas"]["ScaleRead"] | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type_name: "miniature";
            /** Width */
            width: number | null;
        };
        /** OwnedCopyRead */
        OwnedCopyRead: {
            condition: components["schemas"]["ConditionRead"] | null;
            /** Id */
            id: number;
            /** Notes */
            notes: string | null;
            /** Photos */
            photos: components["schemas"]["CopyPhotoRead"][];
        };
        /** Page[ItemListEntryRead] */
        Page_ItemListEntryRead_: {
            /** Items */
            items: components["schemas"]["ItemListEntryRead"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** ReferenceCreate */
        ReferenceCreate: {
            /** Item Type */
            item_type?: string | null;
            /** Name */
            name: string;
        };
        /** ScaleRead */
        ScaleRead: {
            /** Id */
            id: number;
            /** Scale */
            scale: string;
        };
        /** TagRead */
        TagRead: {
            /** Description */
            description: string | null;
            /** Id */
            id: number;
            /** Name */
            name: string;
        };
        /** TitleCreate */
        TitleCreate: {
            /** Language Code */
            language_code: string;
            /** Short Text */
            short_text?: string | null;
            /** Title Text */
            title_text: string;
        };
        /** TitleRead */
        TitleRead: {
            /** Id */
            id: number;
            language: components["schemas"]["LanguageRead"] | null;
            /** Short Text */
            short_text: string | null;
            /** Title Text */
            title_text: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    create_item_items__post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ItemCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_item_items__item_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_item_items__item_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_item_items__item_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ItemUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_cover_items__item_id__cover_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_cover_items__item_id__cover_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_icon_items__item_id__icon_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_icon_items__item_id__icon_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_icon_from_cover_items__item_id__icon_from_cover_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    item_list_items_itemlist_get: {
        parameters: {
            query?: {
                item_type?: string | null;
                limit?: number;
                offset?: number;
                sort_by?: ("title" | "release_date" | "date_added") | null;
                sort_direction?: "asc" | "desc";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ItemListEntryRead_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_media_media__get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaFileRead"][];
                };
            };
        };
    };
    handler_reference_author_roles_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorRoleRead"][];
                };
            };
        };
    };
    create_author_roles_reference_author_roles_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorRoleRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    authors_reference_authors_get: {
        parameters: {
            query?: {
                limit?: number;
                /** @description name contains */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorRead"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_barcode_types_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BarcodeTypeRead"][];
                };
            };
        };
    };
    create_barcode_types_reference_barcode_types_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BarcodeTypeRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    companies_reference_companies_get: {
        parameters: {
            query?: {
                limit?: number;
                /** @description name contains */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyRead"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_company_roles_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyRoleRead"][];
                };
            };
        };
    };
    create_company_roles_reference_company_roles_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyRoleRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_condition_types_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConditionTypeRead"][];
                };
            };
        };
    };
    formats_reference_formats_get: {
        parameters: {
            query?: {
                /** @description item type name */
                item_type?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FormatRead"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_formats_reference_formats_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FormatRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_franchises_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FranchiseRead"][];
                };
            };
        };
    };
    create_franchises_reference_franchises_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FranchiseRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_game_platforms_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GamePlatformRead"][];
                };
            };
        };
    };
    create_game_platforms_reference_game_platforms_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GamePlatformRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    genres_reference_genres_get: {
        parameters: {
            query?: {
                /** @description item type name */
                item_type?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenreRead"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_genres_reference_genres_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenreRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    item_types_reference_item_types_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemTypeScopeRead"][];
                };
            };
        };
    };
    handler_reference_journals_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JournalRead"][];
                };
            };
        };
    };
    create_journals_reference_journals_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JournalRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_languages_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LanguageRead"][];
                };
            };
        };
    };
    handler_reference_scales_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScaleRead"][];
                };
            };
        };
    };
    create_scales_reference_scales_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScaleRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    handler_reference_tags_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TagRead"][];
                };
            };
        };
    };
    create_tags_reference_tags_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TagRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
