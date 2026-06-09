@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.Protected)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "major_type", nullable = false, length = 50)
    private String majorType;

    @Column(name = "sub_type", length = 50)
    private String subType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}